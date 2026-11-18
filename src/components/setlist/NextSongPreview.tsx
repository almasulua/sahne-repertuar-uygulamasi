import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SetlistItem } from '../../types/setlist';

interface NextSongPreviewProps {
  nextItem: SetlistItem;
  currentIndex: number;
  totalCount: number;
  /** Sistem "hareketi azalt" açıksa animasyonlar atlanır */
  reduceMotion?: boolean;
}

export function NextSongPreview({
  nextItem,
  currentIndex,
  totalCount,
  reduceMotion = false,
}: NextSongPreviewProps) {
  const { t } = useTranslation();
  const progress = totalCount > 0 ? (currentIndex + 1) / totalCount : 0;

  // İlerleme çubuğu şarkı değişince yumuşakça kayar
  const progressValue = useSharedValue(progress);
  useEffect(() => {
    progressValue.value = reduceMotion
      ? progress
      : withTiming(progress, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, [progress, reduceMotion, progressValue]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const key = nextItem.custom_key ?? nextItem.song?.key;

  return (
    <View className="bg-surface/90 border-t border-border px-4 py-3 pb-8">
      {/* key değişince eski satır yukarı süzülüp çıkar, yenisi aşağıdan gelir */}
      <Animated.View
        key={nextItem.id}
        entering={reduceMotion ? undefined : FadeInDown.duration(250)}
        exiting={reduceMotion ? undefined : FadeOutUp.duration(150)}
        className="flex-row items-center"
      >
        <Text className="text-text-muted text-xs mr-2">{t('stageMode.next')}:</Text>
        <Text className="text-text-primary text-sm font-semibold flex-1" numberOfLines={1}>
          {nextItem.song?.title ?? t('stageMode.unknownSong')}
        </Text>
        {key && <Text className="text-primary text-xs font-medium ml-2">{key}</Text>}
      </Animated.View>
      {/* İlerleme çubuğu */}
      <View className="flex-row items-center mt-2">
        <View className="flex-1 bg-surface-3 rounded-full h-1 overflow-hidden">
          <Animated.View className="bg-primary rounded-full h-1" style={progressStyle} />
        </View>
        <Text className="text-text-muted text-xs ml-2">
          {currentIndex + 1}/{totalCount}
        </Text>
      </View>
    </View>
  );
}
