import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { SetlistItem } from '../../types/setlist';

interface SetlistItemRowProps {
  item: SetlistItem;
  index: number;
  onRemove?: () => void;
  onEdit?: () => void;
  drag?: () => void;
  isActive?: boolean;
}

export function SetlistItemRow({ item, index, onRemove, onEdit, drag, isActive }: SetlistItemRowProps) {
  if (item.item_type === 'break') {
    return (
      <View
        className={`flex-row items-center bg-light-surface-3 dark:bg-surface-3 rounded-xl px-4 py-3 mb-2 ${
          isActive ? 'opacity-70' : ''
        }`}
      >
        <Text className="text-light-text-muted dark:text-text-muted font-mono w-8 text-center">{index + 1}</Text>
        <View className="flex-1 ml-3">
          <Text className="text-light-text-secondary dark:text-text-secondary italic">
            ☕ Mola {item.break_duration ? `(${item.break_duration} dk)` : ''}
          </Text>
          {item.notes && (
            <Text className="text-light-text-muted dark:text-text-muted text-xs mt-0.5">{item.notes}</Text>
          )}
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} className="p-1 mr-1">
            <Text className="text-primary text-sm">✎</Text>
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity onPress={onRemove} className="p-1">
            <Text className="text-error text-sm">✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const song = item.song;

  return (
    <TouchableOpacity
      onLongPress={drag}
      delayLongPress={200}
      className={`flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 mb-2 border border-light-border dark:border-border ${
        isActive ? 'opacity-70 border-primary' : ''
      }`}
      activeOpacity={0.8}
    >
      <Text className="text-light-text-muted dark:text-text-muted font-mono w-8 text-center">{index + 1}</Text>
      <View className="flex-1 ml-3">
        <Text className="text-light-text-primary dark:text-text-primary font-semibold" numberOfLines={1}>
          {song?.title ?? 'Bilinmeyen Şarkı'}
        </Text>
        {song?.artist && (
          <Text className="text-light-text-secondary dark:text-text-secondary text-xs">{song.artist}</Text>
        )}
      </View>
      <View className="flex-row items-center gap-2">
        {(item.custom_key ?? song?.key) && (
          <Text className="text-primary text-xs font-medium">{item.custom_key ?? song?.key}</Text>
        )}
        {(item.custom_bpm ?? song?.bpm) && (
          <Text className="text-light-text-muted dark:text-text-muted text-xs">{item.custom_bpm ?? song?.bpm} BPM</Text>
        )}
        {item.notes && <Text className="text-accent text-xs">📝</Text>}
        {item.part_assignments && Object.keys(item.part_assignments).length > 0 && (
          <Text className="text-accent text-xs">
            👤{Object.keys(item.part_assignments).length}
          </Text>
        )}
      </View>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} className="ml-2 p-1">
          <Text className="text-primary text-sm">✎</Text>
        </TouchableOpacity>
      )}
      {onRemove && (
        <TouchableOpacity onPress={onRemove} className="ml-1 p-1">
          <Text className="text-error text-sm">✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
