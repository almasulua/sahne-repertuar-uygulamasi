import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, FlatList, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSong, usePersonalSongs, useRemovePersonalSong, useCategories, useUpdatePersonalSong } from '../../../src/hooks/useSongs';
import { usePlayerStore } from '../../../src/stores/playerStore';
import { ChordProRenderer } from '../../../src/components/song/ChordProRenderer';
import { ChordDiagramModal } from '../../../src/components/song/ChordDiagramModal';
import { Metronome } from '../../../src/components/song/Metronome';
import { RecordingPanel } from '../../../src/components/song/RecordingPanel';
import { usePlayHistoryStore } from '../../../src/stores/playHistoryStore';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Badge } from '../../../src/components/ui/Badge';
import { getTransposedKey } from '../../../src/lib/chordpro/transposer';
import { exportToChordPro } from '../../../src/lib/chordpro/exporter';
import { Config } from '../../../src/constants/config';
import { useUIStore } from '../../../src/stores/uiStore';
import * as Clipboard from 'expo-clipboard';

export default function SongDetailScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: song, isLoading } = useSong(songId ?? null);
  const { data: personalSongs } = usePersonalSongs();
  const removePersonal = useRemovePersonalSong();
  const showToast = useUIStore((s) => s.showToast);

  const {
    transposeSteps,
    transposeUp,
    transposeDown,
    resetTranspose,
    capo,
    capoUp,
    capoDown,
    resetCapo,
    isAutoScrolling,
    toggleAutoScrolling,
    scrollSpeed,
    setScrollSpeed,
    fontSize,
    setFontSize,
    showChordsOnly,
    toggleChordsOnly,
    setActiveSong,
  } = usePlayerStore();

  const { data: categories } = useCategories();
  const updatePersonal = useUpdatePersonalSong();

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [chordModalVisible, setChordModalVisible] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [metronomeVisible, setMetronomeVisible] = useState(false);
  const [recordingsVisible, setRecordingsVisible] = useState(false);
  const recordPlay = usePlayHistoryStore((s) => s.recordPlay);
  const playStat = usePlayHistoryStore((s) => (songId ? s.stats[songId] : undefined));
  const playRecordedRef = useRef(false);

  // Aktif şarkıyı store'a kaydet
  useEffect(() => {
    if (songId) setActiveSong(songId);
    playRecordedRef.current = false;
    return () => setActiveSong(null);
  }, [songId]);

  // Çalma kaydı: ekran 15 sn açık kalırsa veya auto-scroll başlarsa
  useEffect(() => {
    if (!songId || playRecordedRef.current) return;
    if (isAutoScrolling) {
      playRecordedRef.current = true;
      recordPlay(songId, song?.duration ?? 0);
      return;
    }
    const timeout = setTimeout(() => {
      if (!playRecordedRef.current) {
        playRecordedRef.current = true;
        recordPlay(songId, song?.duration ?? 0);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [songId, isAutoScrolling, song?.duration, recordPlay]);

  // Otomatik kaydırma
  useEffect(() => {
    if (isAutoScrolling) {
      scrollIntervalRef.current = setInterval(() => {
        scrollViewRef.current?.scrollTo({ y: scrollSpeed, animated: true });
      }, 100);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  const personalSong = personalSongs?.find((ps) => ps.song_id === songId);
  const currentKey = song?.key ? getTransposedKey(song.key, transposeSteps) : null;
  // Capo: gösterilen akorlar -capo perde aşağıya kayar (gerçek ton sabit)
  const displayTransposeSteps = transposeSteps - capo;
  const capoShape = song?.key ? getTransposedKey(song.key, displayTransposeSteps) : null;

  const buildChordProText = () => {
    if (!song) return '';
    return exportToChordPro({
      title: song.title,
      artist: song.artist,
      key: song.key,
      bpm: song.bpm,
      capo: capo > 0 ? capo : null,
      lyrics: song.lyrics,
    });
  };

  const handleShare = () => {
    if (!song) return;
    Alert.alert(
      t('songDetail.shareTitle', 'Şarkıyı Paylaş'),
      t('songDetail.shareSubtitle', 'Bir yöntem seç'),
      [
        {
          text: t('songDetail.copyToClipboard', 'Panoya kopyala'),
          onPress: async () => {
            await Clipboard.setStringAsync(buildChordProText());
            showToast({
              message: t('songDetail.exportedToClipboard', 'ChordPro panoya kopyalandı'),
              type: 'success',
            });
          },
        },
        {
          text: t('songDetail.shareNative', 'Paylaş'),
          onPress: async () => {
            try {
              await Share.share({
                message: buildChordProText(),
                title: song.title,
              });
            } catch (e) {
              if (__DEV__) console.warn('[share]', e);
            }
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleDelete = () => {
    if (!personalSong) return;
    Alert.alert(
      t('repertoire.deleteSong'),
      t('repertoire.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await removePersonal.mutateAsync(personalSong.id);
            showToast({ message: t('repertoire.deletedSuccess'), type: 'success' });
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (!song) {
    return (
      <SafeAreaView className="flex-1 bg-light-background dark:bg-background items-center justify-center">
        <Text className="text-light-text-secondary dark:text-text-secondary">{t('errors.notFound')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Toolbar */}
      <View className="flex-row items-center px-4 py-2 border-b border-light-border dark:border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-light-text-primary dark:text-text-primary font-bold text-base" numberOfLines={1}>
            {song.title}
          </Text>
          {song.artist && (
            <Text className="text-light-text-muted dark:text-text-muted text-xs">{song.artist}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleShare}
          className="ml-2 px-3 py-1.5 bg-light-surface-2 dark:bg-surface-2 rounded-lg"
        >
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('common.share', 'Paylaş')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/repertoire/edit/${songId}`)}
          className="ml-2 px-3 py-1.5 bg-light-surface-2 dark:bg-surface-2 rounded-lg"
        >
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('common.edit')}</Text>
        </TouchableOpacity>
        {personalSong && (
          <TouchableOpacity onPress={handleDelete} className="ml-2 px-3 py-1.5">
            <Text className="text-error text-sm">{t('common.delete')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Kontroller */}
      <View className="bg-light-surface dark:bg-surface border-b border-light-border dark:border-border px-4 py-2">
        {/* Transpozisyon */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-light-text-secondary dark:text-text-secondary text-xs font-medium">
            {t('songDetail.transpose')}
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={transposeDown}
              disabled={transposeSteps <= Config.transpose.min}
              className="w-8 h-8 bg-light-surface-2 dark:bg-surface-2 rounded-lg items-center justify-center"
            >
              <Text className="text-light-text-primary dark:text-text-primary">−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetTranspose}>
              <Text className="text-primary font-semibold w-16 text-center">
                {transposeSteps === 0
                  ? currentKey ?? 'Orijinal'
                  : `${transposeSteps > 0 ? '+' : ''}${transposeSteps} | ${currentKey ?? ''}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={transposeUp}
              disabled={transposeSteps >= Config.transpose.max}
              className="w-8 h-8 bg-light-surface-2 dark:bg-surface-2 rounded-lg items-center justify-center"
            >
              <Text className="text-light-text-primary dark:text-text-primary">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Capo */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-light-text-secondary dark:text-text-secondary text-xs font-medium">
            {t('songDetail.capo', 'Capo')}
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={capoDown}
              disabled={capo <= Config.capo.min}
              className="w-8 h-8 bg-light-surface-2 dark:bg-surface-2 rounded-lg items-center justify-center"
            >
              <Text className="text-light-text-primary dark:text-text-primary">−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetCapo}>
              <Text className="text-primary font-semibold w-20 text-center">
                {capo === 0
                  ? t('songDetail.capoOff', 'Kapalı')
                  : capoShape
                  ? `F${capo} → ${capoShape}`
                  : `Fret ${capo}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={capoUp}
              disabled={capo >= Config.capo.max}
              className="w-8 h-8 bg-light-surface-2 dark:bg-surface-2 rounded-lg items-center justify-center"
            >
              <Text className="text-light-text-primary dark:text-text-primary">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Yazı boyutu + oto-kaydırma */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setFontSize(fontSize - 1)}
              className="w-7 h-7 bg-light-surface-2 dark:bg-surface-2 rounded items-center justify-center"
            >
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs">A−</Text>
            </TouchableOpacity>
            <Text className="text-light-text-muted dark:text-text-muted text-xs w-5 text-center">{fontSize}</Text>
            <TouchableOpacity
              onPress={() => setFontSize(fontSize + 1)}
              className="w-7 h-7 bg-light-surface-2 dark:bg-surface-2 rounded items-center justify-center"
            >
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs">A+</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setMetronomeVisible(true)}
              className="px-2.5 py-1 rounded-lg border border-light-border-light dark:border-border-light"
            >
              <Text className="text-xs text-light-text-secondary dark:text-text-secondary">♩ {song.bpm ?? '—'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRecordingsVisible(true)}
              className="px-2.5 py-1 rounded-lg border border-light-border-light dark:border-border-light"
            >
              <Text className="text-xs text-light-text-secondary dark:text-text-secondary">●</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleChordsOnly}
              className={`px-2.5 py-1 rounded-lg border ${
                showChordsOnly ? 'bg-primary border-primary' : 'border-light-border-light dark:border-border-light'
              }`}
            >
              <Text className={`text-xs ${showChordsOnly ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'}`}>
                Akor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleAutoScrolling}
              className={`px-2.5 py-1 rounded-lg border ${
                isAutoScrolling ? 'bg-accent/20 border-accent' : 'border-light-border-light dark:border-border-light'
              }`}
            >
              <Text className={`text-xs ${isAutoScrolling ? 'text-accent' : 'text-light-text-secondary dark:text-text-secondary'}`}>
                {isAutoScrolling ? '⏸ Dur' : '▶ Oto'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Metadata badges + Kategori */}
      <View className="flex-row flex-wrap gap-1.5 px-4 py-2 items-center">
        {personalSong && (
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            style={{
              backgroundColor: categories?.find((c) => c.name === personalSong.status)?.color ?? '#6366f1',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text className="text-white text-xs font-semibold">
              {categories?.find((c) => c.name === personalSong.status)?.label ?? personalSong.status}
              {' ▾'}
            </Text>
          </TouchableOpacity>
        )}
        {song.key && (
          <Badge label={`Ton: ${currentKey ?? song.key}`} variant="primary" />
        )}
        {song.bpm && <Badge label={`${song.bpm} BPM`} variant="neutral" />}
        {song.difficulty && <Badge label={song.difficulty} variant="neutral" />}
        {playStat && playStat.count > 0 && (
          <Badge label={`${playStat.count}× ${t('stats.played', 'çalındı')}`} variant="neutral" />
        )}
      </View>

      {/* ChordPro İçerik */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {song.lyrics ? (
          <ChordProRenderer
            source={song.lyrics}
            transposeSteps={displayTransposeSteps}
            fontSize={fontSize}
            showChordsOnly={showChordsOnly}
            onChordPress={(chord) => {
              setSelectedChord(chord);
              setChordModalVisible(true);
            }}
          />
        ) : (
          <View className="py-16 items-center">
            <Text className="text-light-text-muted dark:text-text-muted text-center mb-4">
              {t('songDetail.noLyrics')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/repertoire/edit/${songId}`)}
              className="bg-primary px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-sm">{t('songDetail.addLyrics')}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View className="h-32" />
      </ScrollView>
      <ChordDiagramModal
        visible={chordModalVisible}
        chordName={selectedChord}
        onClose={() => setChordModalVisible(false)}
      />

      <Metronome
        visible={metronomeVisible}
        initialBpm={song.bpm}
        onClose={() => setMetronomeVisible(false)}
      />

      <RecordingPanel
        visible={recordingsVisible}
        songId={song.id}
        onClose={() => setRecordingsVisible(false)}
      />

      {/* Kategori Seçici Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
          className="flex-1 bg-black/50 justify-center items-center px-8"
        >
          <View className="bg-light-surface dark:bg-surface rounded-2xl w-full p-4 max-w-sm">
            <Text className="text-light-text-primary dark:text-text-primary font-bold text-base mb-3 text-center">
              {t('categories.selectCategory', 'Kategori Seç')}
            </Text>
            <FlatList
              data={categories ?? []}
              keyExtractor={(cat) => cat.id}
              renderItem={({ item: cat }) => (
                <TouchableOpacity
                  onPress={async () => {
                    if (!personalSong) return;
                    try {
                      await updatePersonal.mutateAsync({ id: personalSong.id, status: cat.name });
                      showToast({ message: `${cat.label} olarak güncellendi`, type: 'success' });
                    } catch {
                      // ignore
                    }
                    setShowCategoryPicker(false);
                  }}
                  className={`flex-row items-center py-3 px-3 rounded-xl mb-1 ${
                    personalSong?.status === cat.name ? 'bg-light-surface-2 dark:bg-surface-2' : ''
                  }`}
                >
                  <View
                    style={{ backgroundColor: cat.color, width: 14, height: 14, borderRadius: 7 }}
                  />
                  <Text className="text-light-text-primary dark:text-text-primary ml-3 flex-1 text-base">{cat.label}</Text>
                  {personalSong?.status === cat.name && (
                    <Text className="text-primary text-sm">✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
