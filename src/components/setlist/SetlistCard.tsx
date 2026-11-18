import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/Badge';
import type { Setlist } from '../../types/setlist';

interface SetlistCardProps {
  setlist: Setlist;
  onPress: () => void;
}

const STATUS_VARIANT = {
  draft: 'neutral',
  active: 'primary',
  archived: 'neutral',
} as const;

export function SetlistCard({ setlist, onPress }: SetlistCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl p-4 mb-3 border border-light-border dark:border-border"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-light-text-primary dark:text-text-primary font-bold text-base flex-1" numberOfLines={1}>
          {setlist.name}
        </Text>
        <Badge label={t(`setlist.${setlist.status}`)} variant={STATUS_VARIANT[setlist.status]} />
      </View>
      {setlist.description && (
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm mb-2" numberOfLines={2}>
          {setlist.description}
        </Text>
      )}
      <View className="flex-row gap-3">
        {setlist.venue && (
          <Text className="text-light-text-muted dark:text-text-muted text-xs">📍 {setlist.venue}</Text>
        )}
        {setlist.event_date && (
          <Text className="text-light-text-muted dark:text-text-muted text-xs">
            📅 {new Date(setlist.event_date).toLocaleDateString('tr-TR')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
