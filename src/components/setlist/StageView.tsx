import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';
import { useStageStore } from '../../stores/stageStore';
import { StageSongView } from './StageSongView';
import { NextSongPreview } from './NextSongPreview';
import { StageSummaryModal } from './StageSummaryModal';
import { StagePage } from './StagePage';
import { usePedalActions } from '../../lib/pedal/dispatch';
import { usePlayerStore } from '../../stores/playerStore';
import type { SetlistItem } from '../../types/setlist';
import type { PedalAction } from '../../lib/pedal/types';

interface StageViewProps {
  items: SetlistItem[];
  groupId: string;
  onExit: () => void;
}

// FlatList bu config'in render'lar arasında değişmesini desteklemez → modül sabiti
const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 50 };

function formatHMS(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StageView({ items, groupId, onExit }: StageViewProps) {
  useKeepAwake();

  const {
    currentItemIndex,
    setCurrentItemIndex,
    stageStartedAt,
    currentSongStartedAt,
    songDurations,
    recordSongDuration,
    startCurrentSongTimer,
  } = useStageStore();
  const flatListRef = useRef<FlatList<SetlistItem>>(null);
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  const previousItemIdRef = useRef<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [summaryVisible, setSummaryVisible] = useState(false);

  const songItems = useMemo(() => items.filter((i) => i.item_type === 'song'), [items]);
  const currentItem = songItems[currentItemIndex];
  const nextItem = songItems[currentItemIndex + 1];

  // Saniye saniye taze tut
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Şarkı değişince önceki şarkının süresini kaydet
  useEffect(() => {
    if (!currentItem) return;
    if (previousItemIdRef.current && previousItemIdRef.current !== currentItem.id) {
      recordSongDuration(previousItemIdRef.current);
    } else if (!previousItemIdRef.current) {
      startCurrentSongTimer();
    }
    previousItemIdRef.current = currentItem.id;
  }, [currentItem?.id, recordSongDuration, startCurrentSongTimer]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentItemIndex(viewableItems[0].index);
      }
    },
    [setCurrentItemIndex],
  );

  // scrollToIndex'in ölçüm beklemeden güvenle çalışması için sabit sayfa düzeni
  const getItemLayout = useCallback(
    (_: ArrayLike<SetlistItem> | null | undefined, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: SetlistItem; index: number }) => (
      <StagePage index={index} width={screenWidth} scrollX={scrollX} reduceMotion={reduceMotion}>
        <StageSongView item={item} groupId={groupId} />
      </StagePage>
    ),
    [screenWidth, scrollX, reduceMotion, groupId],
  );

  // ─── Bluetooth pedal aksiyon handler'ı ─────────────────────────
  const transposeUp = usePlayerStore((s) => s.transposeUp);
  const transposeDown = usePlayerStore((s) => s.transposeDown);
  const handlePedalAction = useCallback(
    (action: PedalAction) => {
      switch (action) {
        case 'next_song':
          if (currentItemIndex < songItems.length - 1) {
            const next = currentItemIndex + 1;
            setCurrentItemIndex(next);
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
          }
          break;
        case 'prev_song':
          if (currentItemIndex > 0) {
            const prev = currentItemIndex - 1;
            setCurrentItemIndex(prev);
            flatListRef.current?.scrollToIndex({ index: prev, animated: true });
          }
          break;
        case 'transpose_up':
          transposeUp();
          break;
        case 'transpose_down':
          transposeDown();
          break;
        // scroll_up/scroll_down/toggle_play: StageSongView'in iç scroll'ı yönetir; bu seviyede noop
        default:
          break;
      }
    },
    [currentItemIndex, songItems.length, setCurrentItemIndex, transposeUp, transposeDown],
  );
  usePedalActions(handlePedalAction);

  const handleExit = () => {
    if (currentItem && currentSongStartedAt) {
      recordSongDuration(currentItem.id);
    }
    setSummaryVisible(true);
  };

  const totalElapsed = stageStartedAt ? now - stageStartedAt : 0;
  const currentSongElapsed = currentSongStartedAt ? now - currentSongStartedAt : 0;

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      {/* Üst bar */}
      <View className="flex-row items-center px-4 pt-12 pb-2">
        <TouchableOpacity onPress={handleExit} className="p-2">
          <Text className="text-white text-lg">✕</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Animated.Text
            key={`counter-${currentItemIndex}`}
            entering={reduceMotion ? undefined : FadeIn.duration(200)}
            className="text-white/70 text-sm"
          >
            {currentItemIndex + 1} / {songItems.length}
          </Animated.Text>
          <View className="flex-row gap-3 mt-0.5">
            <Text className="text-accent text-xs font-mono">
              ♪ {formatHMS(currentSongElapsed)}
            </Text>
            <Text className="text-white/40 text-xs font-mono">
              ⏱ {formatHMS(totalElapsed)}
            </Text>
          </View>
        </View>
        <View className="w-10" />
      </View>

      {/* Şarkılar — horizontal swipe */}
      <Animated.FlatList
        ref={flatListRef}
        data={songItems}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
      />

      {/* Alt bar: sıradaki şarkı */}
      {nextItem && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(250)}
          exiting={reduceMotion ? undefined : FadeOut.duration(200)}
        >
          <NextSongPreview
            nextItem={nextItem}
            currentIndex={currentItemIndex}
            totalCount={songItems.length}
            reduceMotion={reduceMotion}
          />
        </Animated.View>
      )}

      {/* Özet modalı */}
      <StageSummaryModal
        visible={summaryVisible}
        items={songItems}
        durations={songDurations}
        totalElapsedMs={totalElapsed}
        onClose={() => {
          setSummaryVisible(false);
          onExit();
        }}
      />
    </View>
  );
}
