import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroupSongs, useRemoveSongFromGroup, useUpdateGroupSong } from '../../../../../src/hooks/useSongs';
import { LoadingSpinner } from '../../../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../../../src/components/ui/EmptyState';
import { Card } from '../../../../../src/components/ui/Card';
import { Badge } from '../../../../../src/components/ui/Badge';
import { useUIStore } from '../../../../../src/stores/uiStore';
import type { GroupSong, GroupSongStatus } from '../../../../../src/types/song';
import { listPerfProps } from '../../../../../src/lib/listPerf';

type FilterKey = 'all' | GroupSongStatus;

export default function GroupRepertoireScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: groupSongs, isLoading, refetch, isRefetching } = useGroupSongs(groupId ?? null);
  const removeSong = useRemoveSongFromGroup();
  const updateGroupSong = useUpdateGroupSong();
  const showToast = useUIStore((s) => s.showToast);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('repertoire.all', 'Tümü') },
    { key: 'learning', label: t('repertoire.learning', 'Öğreniyorum') },
    { key: 'ready', label: t('repertoire.ready', 'Hazır') },
    { key: 'setlist', label: t('groups.statusSetlist', 'Setlist\'te') },
    { key: 'archived', label: t('repertoire.archived', 'Arşiv') },
  ];

  const filtered = useMemo(() => {
    if (!groupSongs) return [];
    let list: GroupSong[] = [...groupSongs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (gs) =>
          gs.song?.title.toLowerCase().includes(q) ||
          gs.song?.artist?.toLowerCase().includes(q),
      );
    }
    if (filter !== 'all') {
      list = list.filter((gs) => gs.status === filter);
    }
    return list;
  }, [groupSongs, search, filter]);

  const handleRemove = (gs: GroupSong) => {
    Alert.alert(
      t('groups.removeFromGroup', 'Gruptan Çıkar'),
      t(
        'groups.removeFromGroupConfirm',
        '{{title}} grubun repertuarından çıkarılacak. Devam edilsin mi?',
        { title: gs.song?.title ?? '?' },
      ),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('groups.removeFromGroup', 'Gruptan Çıkar'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSong.mutateAsync({ id: gs.id, groupId: groupId! });
              showToast({
                message: t('groups.removedFromGroup', 'Şarkı gruptan çıkarıldı'),
                type: 'success',
              });
            } catch {
              showToast({ message: t('errors.generic'), type: 'error' });
            }
          },
        },
      ],
    );
  };

  const handleChangeStatus = (gs: GroupSong) => {
    const options: GroupSongStatus[] = ['learning', 'ready', 'setlist', 'archived'];
    Alert.alert(
      t('groups.changeStatus', 'Durum Değiştir'),
      gs.song?.title ?? '',
      [
        ...options.map((s) => ({
          text: t(s === 'setlist' ? 'groups.statusSetlist' : `repertoire.${s}`, s),
          onPress: () => {
            if (s === gs.status) return;
            updateGroupSong.mutate({ id: gs.id, groupId: groupId!, status: s });
          },
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ],
    );
  };

  const statusBadgeVariant = (status: GroupSongStatus) =>
    status === 'ready'
      ? 'success'
      : status === 'setlist'
      ? 'primary'
      : status === 'learning'
      ? 'warning'
      : 'neutral';

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('groups.repertoire')}
        </Text>
        <Text className="text-light-text-muted dark:text-text-muted text-xs">
          {filtered.length}/{groupSongs?.length ?? 0}
        </Text>
      </View>

      {/* Ekleme Butonlari */}
      <View className="px-4 mb-3 gap-2">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/groups/${groupId}/repertoire/add`)}
            className="flex-1 bg-primary py-3 rounded-xl items-center"
          >
            <Text className="text-white text-sm font-semibold">+ {t('groups.addNewSong')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/groups/${groupId}/repertoire/from-personal`)}
            className="flex-1 bg-light-surface-2 dark:bg-surface-2 py-3 rounded-xl items-center border border-light-border dark:border-border"
          >
            <Text className="text-light-text-primary dark:text-text-primary text-sm font-medium">{t('groups.fromPersonal')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/browser/' as never)}
          className="bg-light-surface-2 dark:bg-surface-2 py-3 rounded-xl items-center border border-light-border dark:border-border"
        >
          <Text className="text-light-text-primary dark:text-text-primary text-sm font-medium">{t('groups.fromWeb')}</Text>
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View className="mx-4 mb-3">
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-2.5 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border"
          placeholder={t('repertoire.searchPlaceholder')}
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtreler */}
      <View className="mb-2">
        <FlatList
          horizontal
          data={filterTabs}
          keyExtractor={(o) => o.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded-full border ${
                filter === item.key
                  ? 'bg-primary border-primary'
                  : 'border-light-border-light dark:border-border-light bg-light-surface-2 dark:bg-surface-2'
              }`}
            >
              <Text
                className={`text-sm ${
                  filter === item.key ? 'text-white font-semibold' : 'text-light-text-secondary dark:text-text-secondary'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Şarkı Listesi */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          {...listPerfProps}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />
          }
          ListEmptyComponent={
            <EmptyState
              title={t('groups.noGroupSongs')}
              subtitle={t('groups.addSongsHint')}
            />
          }
          renderItem={({ item }) => {
            const song = item.song;
            return (
              <Card
                onPress={() => song && router.push(`/song/${song.id}`)}
                className="mb-2"
              >
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-light-text-primary dark:text-text-primary font-semibold" numberOfLines={1}>
                      {song?.title ?? '?'}
                    </Text>
                    {song?.artist && (
                      <Text className="text-light-text-secondary dark:text-text-secondary text-sm" numberOfLines={1}>
                        {song.artist}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    {song?.key && <Badge label={song.key} variant="primary" />}
                    {song?.bpm && <Badge label={`${song.bpm}`} variant="neutral" />}
                    <TouchableOpacity onPress={() => handleChangeStatus(item)}>
                      <Badge
                        label={t(
                          item.status === 'setlist'
                            ? 'groups.statusSetlist'
                            : `repertoire.${item.status}`,
                          item.status,
                        )}
                        variant={statusBadgeVariant(item.status)}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemove(item)} className="ml-1 p-1">
                      <Text className="text-error text-base">✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
