import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroupActivities } from '../../../../src/hooks/useActivities';
import { SkeletonList, ActivityRowSkeleton } from '../../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { Avatar } from '../../../../src/components/ui/Avatar';
import type { GroupActivity, ActivityActionType } from '../../../../src/types/activity';
import { listPerfProps } from '../../../../src/lib/listPerf';

const ICON: Record<ActivityActionType, string> = {
  song_added: '➕',
  song_removed: '➖',
  song_status_changed: '🔄',
  setlist_created: '🎵',
  setlist_deleted: '🗑️',
  poll_created: '📊',
  event_created: '📅',
  member_joined: '👋',
  member_left: '🚪',
  member_role_changed: '⭐',
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'şimdi';
  if (min < 60) return `${min} dk önce`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString();
}

function describe(activity: GroupActivity, t: TFunction): string {
  const m = activity.metadata as Record<string, string | undefined>;
  switch (activity.action_type) {
    case 'song_added':
      return t('activity.songAdded', '{{title}} repertuara eklendi', { title: m.title ?? '?' });
    case 'song_removed':
      return t('activity.songRemoved', '{{title}} repertuardan çıkarıldı', { title: m.title ?? '?' });
    case 'song_status_changed':
      return t('activity.songStatusChanged', '{{title}}: {{old}} → {{new}}', {
        title: m.title ?? '?',
        old: m.old_status ?? '?',
        new: m.new_status ?? '?',
      });
    case 'setlist_created':
      return t('activity.setlistCreated', '{{name}} setlisti oluşturuldu', { name: m.name ?? '?' });
    case 'setlist_deleted':
      return t('activity.setlistDeleted', '{{name}} setlisti silindi', { name: m.name ?? '?' });
    case 'poll_created':
      return t('activity.pollCreated', 'Yeni anket: {{question}}', { question: m.question ?? '?' });
    case 'event_created':
      return t('activity.eventCreated', 'Yeni etkinlik: {{title}}', { title: m.title ?? '?' });
    case 'member_joined':
      return t('activity.memberJoined', '{{username}} gruba katıldı', { username: m.username ?? '?' });
    case 'member_left':
      return t('activity.memberLeft', '{{username}} gruptan ayrıldı', { username: m.username ?? '?' });
    case 'member_role_changed':
      return t('activity.memberRoleChanged', '{{username}}: {{old}} → {{new}}', {
        username: m.username ?? '?',
        old: m.old_role ?? '?',
        new: m.new_role ?? '?',
      });
    default:
      return activity.action_type;
  }
}

export default function GroupActivityScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: activities, isLoading, refetch, isRefetching } = useGroupActivities(groupId ?? null);

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('activity.title', 'Aktivite')}
        </Text>
      </View>

      {isLoading ? (
        <View className="px-4">
          <SkeletonList count={6} Item={ActivityRowSkeleton} />
        </View>
      ) : (
        <FlatList
          {...listPerfProps}
          data={activities ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />
          }
          ListEmptyComponent={
            <EmptyState
              title={t('activity.empty', 'Henüz aktivite yok')}
              subtitle={t(
                'activity.emptyHint',
                'Şarkı, setlist, oylama veya etkinlik ekledikçe burada görünür.',
              )}
              icon="🪵"
            />
          }
          renderItem={({ item }) => {
            const actorName =
              item.actor?.display_name ?? item.actor?.username ?? t('activity.unknown', 'Bilinmiyor');
            return (
              <View className="flex-row items-start bg-light-surface-2 dark:bg-surface-2 rounded-xl px-3 py-3 mb-2 border border-light-border dark:border-border">
                <Avatar uri={item.actor?.avatar_url} name={actorName} size="sm" />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-baseline flex-wrap">
                    <Text className="text-light-text-primary dark:text-text-primary text-sm font-semibold mr-1">
                      {actorName}
                    </Text>
                    <Text className="text-light-text-muted dark:text-text-muted text-xs">{formatRelative(item.created_at)}</Text>
                  </View>
                  <View className="flex-row items-start mt-0.5">
                    <Text className="text-base mr-1.5">{ICON[item.action_type] ?? '•'}</Text>
                    <Text className="text-light-text-secondary dark:text-text-secondary text-sm flex-1">{describe(item, t)}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
