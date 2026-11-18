import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayHistoryStore } from '../src/stores/playHistoryStore';
import { usePersonalSongs } from '../src/hooks/useSongs';
import { EmptyState } from '../src/components/ui/EmptyState';

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 60) return `${min} dk önce`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.round(h / 24);
  return `${d} gün önce`;
}

export default function StatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const stats = usePlayHistoryStore((s) => s.stats);
  const reset = usePlayHistoryStore((s) => s.reset);
  const { data: songs } = usePersonalSongs();

  const songMap = new Map((songs ?? []).map((ps) => [ps.song_id, ps]));
  const totalPlays = Object.values(stats).reduce((sum, st) => sum + st.count, 0);
  const uniqueSongs = Object.keys(stats).length;
  const top = Object.values(stats).sort((a, b) => b.count - a.count).slice(0, 5);
  const recent = Object.values(stats)
    .sort(
      (a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime()
    )
    .slice(0, 5);

  const handleReset = () => {
    Alert.alert(
      t('stats.resetTitle', 'Geçmişi sıfırla'),
      t('stats.resetConfirm', 'Tüm çalma geçmişin silinecek. Devam edilsin mi?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => reset() },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('stats.title', 'İstatistikler')}
        </Text>
        {totalPlays > 0 && (
          <TouchableOpacity onPress={handleReset} className="px-2 py-1">
            <Text className="text-error text-sm">{t('common.reset', 'Sıfırla')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {totalPlays === 0 ? (
          <EmptyState
            title={t('stats.empty', 'Henüz çalma geçmişi yok')}
            subtitle={t(
              'stats.emptyHint',
              'Bir şarkıyı 15 saniyeden fazla aç ya da otomatik kaydırmayı başlat.'
            )}
            icon="📊"
          />
        ) : (
          <>
            {/* Özet kartları */}
            <View className="flex-row gap-3 mt-3">
              <View className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-2xl py-4 items-center border border-light-border dark:border-border">
                <Text className="text-light-text-primary dark:text-text-primary text-3xl font-bold">{totalPlays}</Text>
                <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-1">
                  {t('stats.totalPlays', 'Toplam çalma')}
                </Text>
              </View>
              <View className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-2xl py-4 items-center border border-light-border dark:border-border">
                <Text className="text-light-text-primary dark:text-text-primary text-3xl font-bold">{uniqueSongs}</Text>
                <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-1">
                  {t('stats.uniqueSongs', 'Farklı şarkı')}
                </Text>
              </View>
            </View>

            {/* En çok çalınanlar */}
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mt-6 mb-2">
              {t('stats.topPlayed', 'En çok çalınanlar')}
            </Text>
            <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl border border-light-border dark:border-border overflow-hidden">
              {top.map((stat, i) => {
                const ps = songMap.get(stat.songId);
                return (
                  <TouchableOpacity
                    key={stat.songId}
                    onPress={() => router.push(`/(tabs)/repertoire/${stat.songId}`)}
                    className={`flex-row items-center px-4 py-3 ${
                      i < top.length - 1 ? 'border-b border-light-border dark:border-border' : ''
                    }`}
                  >
                    <Text className="text-light-text-muted dark:text-text-muted text-sm w-6">{i + 1}</Text>
                    <View className="flex-1">
                      <Text className="text-light-text-primary dark:text-text-primary font-medium" numberOfLines={1}>
                        {ps?.song?.title ?? `Şarkı (${stat.songId.slice(0, 6)})`}
                      </Text>
                      {ps?.song?.artist && (
                        <Text className="text-light-text-muted dark:text-text-muted text-xs" numberOfLines={1}>
                          {ps.song.artist}
                        </Text>
                      )}
                    </View>
                    <Text className="text-primary font-semibold">{stat.count}×</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Son çalınanlar */}
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mt-6 mb-2">
              {t('stats.recent', 'Son çalınanlar')}
            </Text>
            <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl border border-light-border dark:border-border overflow-hidden">
              {recent.map((stat, i) => {
                const ps = songMap.get(stat.songId);
                return (
                  <TouchableOpacity
                    key={stat.songId}
                    onPress={() => router.push(`/(tabs)/repertoire/${stat.songId}`)}
                    className={`flex-row items-center px-4 py-3 ${
                      i < recent.length - 1 ? 'border-b border-light-border dark:border-border' : ''
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="text-light-text-primary dark:text-text-primary font-medium" numberOfLines={1}>
                        {ps?.song?.title ?? `Şarkı (${stat.songId.slice(0, 6)})`}
                      </Text>
                      <Text className="text-light-text-muted dark:text-text-muted text-xs">
                        {formatRelative(stat.lastPlayedAt)}
                      </Text>
                    </View>
                    <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{stat.count}×</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
