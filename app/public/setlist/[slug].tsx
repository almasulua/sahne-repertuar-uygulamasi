import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePublicSetlist } from '../../../src/hooks/useSetlists';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Badge } from '../../../src/components/ui/Badge';
import { calculateTotalDuration, formatDuration, getSongCount } from '../../../src/lib/setlist/utils';
import { listPerfProps } from '../../../src/lib/listPerf';
import type { SetlistItem } from '../../../src/types/setlist';

/**
 * Public (auth gerektirmeyen) setlist görüntüleyici.
 * RLS: setlists/setlist_items/songs için is_public=true olan kayıtlar anon role'a açık.
 * Düzenleme / drag / silme yok — sadece read-only liste.
 */
export default function PublicSetlistScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const { data: setlist, isLoading, error } = usePublicSetlist(slug ?? null);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-light-background dark:bg-background items-center justify-center">
        <ActivityIndicator color="#a78bfa" />
      </SafeAreaView>
    );
  }

  if (error || !setlist) {
    return (
      <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
        <EmptyState
          title={t('setlist.publicNotFound', 'Setlist bulunamadı')}
          subtitle={t('setlist.publicNotFoundDesc', 'Bağlantı geçersiz veya artık public değil')}
          icon="🔒"
        />
      </SafeAreaView>
    );
  }

  const totalDuration = calculateTotalDuration(setlist.items);
  const songCount = getSongCount(setlist.items);

  const renderItem = ({ item, index }: { item: SetlistItem; index: number }) => {
    if (item.item_type === 'break') {
      return (
        <View className="flex-row items-center bg-light-surface-3 dark:bg-surface-3 rounded-xl px-4 py-3 mb-2">
          <Text className="text-light-text-muted dark:text-text-muted font-mono w-8 text-center">{index + 1}</Text>
          <Text className="text-light-text-secondary dark:text-text-secondary italic ml-3">
            ☕ {t('setlist.break', 'Mola')}
            {item.break_duration ? ` (${item.break_duration} dk)` : ''}
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-row items-start bg-light-surface-1 dark:bg-surface-1 rounded-xl px-4 py-3 mb-2 border border-light-border dark:border-border">
        <Text className="text-light-text-muted dark:text-text-muted font-mono w-8 text-center pt-0.5">{index + 1}</Text>
        <View className="flex-1 ml-3">
          <Text className="text-light-text-primary dark:text-text-primary font-semibold" numberOfLines={1}>
            {item.song?.title ?? t('setlist.unknownSong', 'Bilinmeyen şarkı')}
          </Text>
          {item.song?.artist ? (
            <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-0.5" numberOfLines={1}>
              {item.song.artist}
            </Text>
          ) : null}
          {(item.custom_key ?? item.song?.key) || (item.custom_bpm ?? item.song?.bpm) ? (
            <View className="flex-row gap-1.5 mt-1.5">
              {(item.custom_key ?? item.song?.key) ? (
                <Badge label={String(item.custom_key ?? item.song?.key)} variant="primary" />
              ) : null}
              {(item.custom_bpm ?? item.song?.bpm) ? (
                <Badge label={`${item.custom_bpm ?? item.song?.bpm} BPM`} variant="neutral" />
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-light-text-muted dark:text-text-muted text-xs uppercase tracking-wider mb-1">
          {t('setlist.publicBadge', 'Herkese açık setlist')}
        </Text>
        <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold">{setlist.name}</Text>
        {setlist.description ? (
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm mt-1">{setlist.description}</Text>
        ) : null}
        {setlist.venue || setlist.event_date ? (
          <View className="flex-row flex-wrap gap-3 mt-2">
            {setlist.venue ? (
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs">📍 {setlist.venue}</Text>
            ) : null}
            {setlist.event_date ? (
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs">
                📅 {new Date(setlist.event_date).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Meta */}
      <View className="flex-row flex-wrap gap-2 px-4 mb-3">
        <Badge label={`${songCount} ${t('setlist.songs', 'şarkı')}`} variant="primary" />
        <Badge label={formatDuration(totalDuration)} variant="neutral" />
      </View>

      <FlatList
        {...listPerfProps}
        data={setlist.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <Text className="text-light-text-muted dark:text-text-muted text-center py-12">
            {t('setlist.noItems', 'Bu setlist boş')}
          </Text>
        }
      />
    </SafeAreaView>
  );
}
