import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePersonalSongs, useGroupSongs, useAddSongToGroup } from '../../../../../src/hooks/useSongs';
import { LoadingSpinner } from '../../../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../../../src/components/ui/EmptyState';
import { Badge } from '../../../../../src/components/ui/Badge';
import { useUIStore } from '../../../../../src/stores/uiStore';

export default function FromPersonalScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: personalSongs, isLoading: loadingPersonal } = usePersonalSongs();
  const { data: groupSongs } = useGroupSongs(groupId ?? null);
  const addToGroup = useAddSongToGroup();
  const showToast = useUIStore((s) => s.showToast);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Zaten grupta olan sarkıları filtrele
  const groupSongIds = new Set(groupSongs?.map((gs) => gs.song_id) ?? []);
  const available = personalSongs?.filter((ps) => !groupSongIds.has(ps.song_id)) ?? [];

  const toggleSelect = (songId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0 || !groupId) return;
    try {
      for (const songId of selected) {
        await addToGroup.mutateAsync({ groupId, songId });
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

  if (loadingPersonal) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('groups.fromPersonal')}
        </Text>
      </View>

      {/* Bilgi */}
      {selected.size > 0 && (
        <View className="mx-4 mb-2 bg-primary/10 rounded-xl px-4 py-2">
          <Text className="text-primary text-sm font-medium">
            {selected.size} {t('groups.songsSelected')}
          </Text>
        </View>
      )}

      {/* Sarkı Listesi */}
      <FlatList
        data={available}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            title={t('groups.noPersonalSongs')}
            subtitle={t('groups.addToPersonalFirst')}
          />
        }
        renderItem={({ item }) => {
          const song = item.song;
          const isSelected = selected.has(item.song_id);
          return (
            <TouchableOpacity
              onPress={() => toggleSelect(item.song_id)}
              className={`flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 mb-2 border ${
                isSelected ? 'border-primary bg-primary/5' : 'border-light-border dark:border-border'
              }`}
              activeOpacity={0.7}
            >
              {/* Checkbox */}
              <View
                className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${
                  isSelected ? 'bg-primary border-primary' : 'border-light-border dark:border-border'
                }`}
              >
                {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
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

      {/* Alt buton */}
      {selected.size > 0 && (
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-light-background dark:bg-background border-t border-light-border dark:border-border">
          <TouchableOpacity
            onPress={handleAdd}
            disabled={addToGroup.isPending}
            className={`py-3.5 rounded-xl items-center ${addToGroup.isPending ? 'bg-light-surface-3 dark:bg-surface-3' : 'bg-primary'}`}
          >
            <Text className="text-white font-semibold">
              {addToGroup.isPending
                ? t('common.loading')
                : `${t('groups.addToGroup')} (${selected.size})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
