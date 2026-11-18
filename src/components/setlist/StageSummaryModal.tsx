import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { SetlistItem } from '../../types/setlist';

interface Props {
  visible: boolean;
  items: SetlistItem[];
  durations: Record<string, number>;
  totalElapsedMs: number;
  onClose: () => void;
}

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Sahne modu çıkışında konser özetini gösterir */
export function StageSummaryModal({
  visible,
  items,
  durations,
  totalElapsedMs,
  onClose,
}: Props) {
  const { t } = useTranslation();

  const playedItems = items.filter((it) => durations[it.id]);
  const totalSongMs = playedItems.reduce((sum, it) => sum + (durations[it.id] ?? 0), 0);
  const longest = playedItems.reduce<{ id: string; ms: number } | null>((acc, it) => {
    const ms = durations[it.id] ?? 0;
    return !acc || ms > acc.ms ? { id: it.id, ms } : acc;
  }, null);
  const longestSong = longest ? items.find((i) => i.id === longest.id) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
        <View className="flex-row items-center px-5 py-4 border-b border-light-border dark:border-border">
          <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold flex-1">
            {t('stage.summaryTitle', 'Konser Özeti')}
          </Text>
          <TouchableOpacity onPress={onClose} className="bg-primary px-4 py-2 rounded-lg">
            <Text className="text-white text-sm font-semibold">{t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 16 }}>
          {/* Üst kartlar */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-2xl py-4 items-center border border-light-border dark:border-border">
              <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold">{playedItems.length}</Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-1">
                {t('stage.songsPlayed', 'Çalınan şarkı')}
              </Text>
            </View>
            <View className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-2xl py-4 items-center border border-light-border dark:border-border">
              <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold">{formatMs(totalElapsedMs)}</Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-1">
                {t('stage.totalDuration', 'Toplam süre')}
              </Text>
            </View>
          </View>

          {/* En uzun çalınan */}
          {longestSong && longest && (
            <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl px-4 py-3 mb-4 border border-light-border dark:border-border">
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs mb-1">
                {t('stage.longestSong', 'En uzun çalınan')}
              </Text>
              <Text className="text-light-text-primary dark:text-text-primary font-semibold" numberOfLines={1}>
                {longestSong.song?.title ?? '-'}
              </Text>
              <Text className="text-accent text-sm font-mono">{formatMs(longest.ms)}</Text>
            </View>
          )}

          {/* Şarkı listesi */}
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">
            {t('stage.breakdown', 'Şarkı dökümü')}
          </Text>
          <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl border border-light-border dark:border-border overflow-hidden">
            {items.map((it, i) => {
              const ms = durations[it.id] ?? 0;
              const wasPlayed = ms > 0;
              return (
                <View
                  key={it.id}
                  className={`flex-row items-center px-4 py-3 ${
                    i < items.length - 1 ? 'border-b border-light-border dark:border-border' : ''
                  }`}
                >
                  <Text className="text-light-text-muted dark:text-text-muted font-mono w-6 text-center">{i + 1}</Text>
                  <View className="flex-1 ml-3">
                    <Text
                      className={`font-medium ${wasPlayed ? 'text-light-text-primary dark:text-text-primary' : 'text-light-text-muted dark:text-text-muted'}`}
                      numberOfLines={1}
                    >
                      {it.song?.title ?? `(${t('setlist.break', 'Mola')})`}
                    </Text>
                    {it.song?.artist && (
                      <Text className="text-light-text-muted dark:text-text-muted text-xs" numberOfLines={1}>
                        {it.song.artist}
                      </Text>
                    )}
                  </View>
                  <Text
                    className={`text-sm font-mono ${wasPlayed ? 'text-accent' : 'text-light-text-muted dark:text-text-muted'}`}
                  >
                    {wasPlayed ? formatMs(ms) : '—'}
                  </Text>
                </View>
              );
            })}
          </View>

          {playedItems.length < items.filter((i) => i.item_type === 'song').length && (
            <Text className="text-light-text-muted dark:text-text-muted text-xs text-center mt-3">
              {t(
                'stage.partialNote',
                'Çizgili şarkılar henüz çalınmadı veya atlandı.'
              )}
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
