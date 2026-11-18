import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMusicianMatches } from '../src/hooks/useProfile';
import { Avatar } from '../src/components/ui/Avatar';
import { Badge } from '../src/components/ui/Badge';
import { EmptyState } from '../src/components/ui/EmptyState';
import { SkeletonList, ActivityRowSkeleton } from '../src/components/ui/Skeleton';
import { listPerfProps } from '../src/lib/listPerf';
import { safeBack } from '../src/lib/navigation';
import type { MusicianMatch } from '../src/api/auth';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#6b7280';
  return (
    <View
      style={{ backgroundColor: color }}
      className="rounded-full px-2 py-0.5 items-center justify-center"
    >
      <Text className="text-white text-xs font-bold">{score}</Text>
    </View>
  );
}

export default function MatchesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: matches = [], isLoading, refetch, isRefetching } = useMusicianMatches(30);

  const renderItem = ({ item }: { item: MusicianMatch }) => (
    <TouchableOpacity
      onPress={() => router.push(`/user/${item.id}` as never)}
      className="flex-row items-center bg-light-surface-1 dark:bg-surface-1 rounded-xl px-4 py-3 mb-2 border border-light-border dark:border-border"
    >
      <Avatar uri={item.avatar_url} name={item.display_name ?? item.username} size="md" />
      <View className="flex-1 ml-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-light-text-primary dark:text-text-primary font-semibold flex-1" numberOfLines={1}>
            {item.display_name ?? item.username}
          </Text>
          <ScoreBadge score={item.score} />
        </View>
        <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-0.5">@{item.username}</Text>
        {item.shared_instruments.length > 0 ? (
          <View className="flex-row flex-wrap gap-1 mt-2">
            {item.shared_instruments.slice(0, 4).map((inst) => (
              <Badge key={`i-${inst}`} label={inst} variant="primary" />
            ))}
            {item.shared_genres.slice(0, 2).map((g) => (
              <Badge key={`g-${g}`} label={g} variant="neutral" />
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => safeBack('/(tabs)/profile')} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold">
            {t('matches.title', 'Müzisyen Önerileri')}
          </Text>
          <Text className="text-light-text-muted dark:text-text-muted text-xs mt-0.5">
            {t('matches.subtitle', 'Enstrüman, tür ve seviyene göre uyum skoru')}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="px-4">
          <SkeletonList count={6} Item={ActivityRowSkeleton} />
        </View>
      ) : (
        <FlatList
          {...listPerfProps}
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />
          }
          ListEmptyComponent={
            <EmptyState
              title={t('matches.empty', 'Eşleşme bulunamadı')}
              subtitle={t(
                'matches.emptyDesc',
                'Profilinde enstrüman ve tür ekledikten sonra öneriler burada görünür.',
              )}
              icon="🎸"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
