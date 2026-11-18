import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSetlist, useAddSetlistItem } from '../../../../../../src/hooks/useSetlists';
import { useGroupSongs, usePersonalSongs, useAddSongToGroup } from '../../../../../../src/hooks/useSongs';
import { Badge } from '../../../../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../../../../src/components/ui/EmptyState';
import { useUIStore } from '../../../../../../src/stores/uiStore';
import type { GroupSong, PersonalSong } from '../../../../../../src/types/song';

type Tab = 'group' | 'personal';
type SelectableSong = GroupSong | PersonalSong;

export default function SetlistAddSongScreen() {
  const { groupId, setlistId } = useLocalSearchParams<{ groupId: string; setlistId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: setlist } = useSetlist(setlistId ?? null);
  const { data: groupSongs, isLoading: loadingGroup } = useGroupSongs(groupId ?? null);
  const { data: personalSongs, isLoading: loadingPersonal } = usePersonalSongs();
  const addItem = useAddSetlistItem();
  const addSongToGroup = useAddSongToGroup();
  const showToast = useUIStore((s) => s.showToast);

  const [tab, setTab] = useState<Tab>('group');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const setlistSongIds = new Set(setlist?.items.map((i) => i.song_id).filter(Boolean) ?? []);

  // Grup repertuarından setlistte olmayan sarkilar
  const availableGroupSongs = groupSongs?.filter(
    (gs) => !setlistSongIds.has(gs.song_id)
  ) ?? [];

  // Kisisel repertuardan grupta olmayan sarkilar
  const groupSongIds = new Set(groupSongs?.map((gs) => gs.song_id) ?? []);
  const availablePersonalSongs = personalSongs?.filter(
    (ps) => !groupSongIds.has(ps.song_id) && !setlistSongIds.has(ps.song_id)
  ) ?? [];

  const toggleSelect = (songId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0 || !setlist || !groupId) return;
    try {
      let position = setlist.items.length;

      if (tab === 'personal') {
        // Kisisel sarkilari once gruba ekle
        for (const songId of selected) {
          await addSongToGroup.mutateAsync({ groupId, songId });
        }
      }

      for (const songId of selected) {
        await addItem.mutateAsync({
          setlist_id: setlist.id,
          song_id: songId,
          item_type: 'song',
          position,
        });
        position++;
      }

      showToast({
        message: `${selected.size} ${t('groups.songsAddedToGroup')}`,
        type: 'success',
      });
      router.back();
    } catch {
      showToast({ message: t('errors.generic'), type: 'error' });
    }
  };

  const isLoading = tab === 'group' ? loadingGroup : loadingPersonal;
  const data: SelectableSong[] = tab === 'group' ? availableGroupSongs : availablePersonalSongs;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">{'\u2190'}</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('setlist.addSong')}
        </Text>
      </View>

      {/* Action buttons */}
      <View className="px-4 mb-3 gap-2">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/groups/${groupId}/repertoire/add` as never)}
            className="flex-1 bg-primary py-3 rounded-xl items-center"
          >
            <Text className="text-white text-sm font-semibold">+ {t('groups.addNewSong')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/browser/' as never)}
            className="flex-1 bg-light-surface-2 dark:bg-surface-2 py-3 rounded-xl items-center border border-light-border dark:border-border"
          >
            <Text className="text-light-text-primary dark:text-text-primary text-sm font-medium">{t('groups.fromWeb')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-3 gap-2">
        <TouchableOpacity
          onPress={() => { setTab('group'); setSelected(new Set()); }}
          className={`flex-1 py-2.5 rounded-xl items-center border ${
            tab === 'group' ? 'bg-primary border-primary' : 'bg-light-surface-2 dark:bg-surface-2 border-light-border dark:border-border'
          }`}
        >
          <Text className={`text-sm font-medium ${tab === 'group' ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'}`}>
            {t('groups.repertoire')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setTab('personal'); setSelected(new Set()); }}
          className={`flex-1 py-2.5 rounded-xl items-center border ${
            tab === 'personal' ? 'bg-primary border-primary' : 'bg-light-surface-2 dark:bg-surface-2 border-light-border dark:border-border'
          }`}
        >
          <Text className={`text-sm font-medium ${tab === 'personal' ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'}`}>
            {t('groups.fromPersonal')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected info */}
      {selected.size > 0 && (
        <View className="mx-4 mb-2 bg-primary/10 rounded-xl px-4 py-2">
          <Text className="text-primary text-sm font-medium">
            {selected.size} {t('groups.songsSelected')}
          </Text>
        </View>
      )}

      {/* Song List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <EmptyState
              title={tab === 'group' ? t('groups.noGroupSongs') : t('groups.noPersonalSongs')}
              subtitle={tab === 'group' ? t('groups.addSongsHint') : t('groups.addToPersonalFirst')}
            />
          }
          renderItem={({ item }) => {
            const song = item.song;
            const songId = item.song_id;
            const isSelected = selected.has(songId);
            return (
              <TouchableOpacity
                onPress={() => toggleSelect(songId)}
                className={`flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 mb-2 border ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-light-border dark:border-border'
                }`}
                activeOpacity={0.7}
              >
                <View
                  className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${
                    isSelected ? 'bg-primary border-primary' : 'border-light-border dark:border-border'
                  }`}
                >
                  {isSelected && <Text className="text-white text-xs font-bold">{'\u2713'}</Text>}
                </View>
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
                <View className="flex-row gap-1.5">
                  {song?.key && <Badge label={song.key} variant="primary" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Bottom button */}
      {selected.size > 0 && (
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-light-background dark:bg-background border-t border-light-border dark:border-border">
          <TouchableOpacity
            onPress={handleAdd}
            disabled={addItem.isPending || addSongToGroup.isPending}
            className={`py-3.5 rounded-xl items-center ${
              addItem.isPending || addSongToGroup.isPending ? 'bg-light-surface-3 dark:bg-surface-3' : 'bg-primary'
            }`}
          >
            <Text className="text-white font-semibold">
              {addItem.isPending || addSongToGroup.isPending
                ? t('common.loading')
                : `${t('setlist.addSong')} (${selected.size})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
