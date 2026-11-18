import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChordProRenderer } from '../song/ChordProRenderer';
import { useStageStore } from '../../stores/stageStore';
import { useGroup } from '../../hooks/useGroups';
import type { SetlistItem } from '../../types/setlist';

interface StageSongViewProps {
  item: SetlistItem;
  groupId?: string;
}

export function StageSongView({ item, groupId }: StageSongViewProps) {
  const { t } = useTranslation();
  const { stageFontSize } = useStageStore();
  const { data: group } = useGroup(groupId ?? null);
  const song = item.song;

  const partList = useMemo(() => {
    const assignments = item.part_assignments ?? {};
    if (!group?.members?.length || Object.keys(assignments).length === 0) return [];
    return group.members
      .filter((m) => assignments[m.user_id])
      .map((m) => ({
        userId: m.user_id,
        name: m.user?.display_name ?? m.user?.username ?? m.user_id.slice(0, 6),
        part: assignments[m.user_id],
      }));
  }, [group, item.part_assignments]);

  if (!song) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white/50 text-lg">Şarkı bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
      {/* Başlık */}
      <View className="pt-4 pb-2">
        <Text className="text-white text-xl font-bold">{song.title}</Text>
        {song.artist && (
          <Text className="text-white/60 text-sm">{song.artist}</Text>
        )}
        <View className="flex-row gap-3 mt-1">
          {(item.custom_key ?? song.key) && (
            <Text className="text-primary text-sm font-semibold">
              {item.custom_key ?? song.key}
            </Text>
          )}
          {(item.custom_bpm ?? song.bpm) && (
            <Text className="text-white/50 text-sm">
              {item.custom_bpm ?? song.bpm} BPM
            </Text>
          )}
        </View>
      </View>

      {/* Part atamaları */}
      {partList.length > 0 && (
        <View className="bg-white/5 rounded-xl px-3 py-2 mb-3">
          <Text className="text-white/40 text-xs mb-1.5">
            {t('setlist.partAssignments', 'Üye part ataması')}
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {partList.map((p) => (
              <View
                key={p.userId}
                className="bg-primary/20 border border-primary/40 rounded-full px-2.5 py-0.5"
              >
                <Text className="text-primary text-xs">
                  <Text className="font-semibold">{p.name}</Text>
                  <Text className="text-white/60"> · {p.part}</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ChordPro içerik */}
      {song.lyrics ? (
        <ChordProRenderer source={song.lyrics} fontSize={stageFontSize} />
      ) : (
        <Text className="text-white/30 text-center mt-8">Sözler eklenmemiş</Text>
      )}

      {/* Notes */}
      {item.notes && (
        <View className="bg-surface-2 rounded-xl p-3 mt-4">
          <Text className="text-text-secondary text-sm italic">{item.notes}</Text>
        </View>
      )}

      <View className="h-32" />
    </ScrollView>
  );
}
