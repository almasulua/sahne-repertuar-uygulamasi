import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { PersonalSong } from '../../types/song';

interface SongCardProps {
  personalSong: PersonalSong;
  onPress?: () => void;
  onFavoriteToggle?: () => void;
  compact?: boolean;
}

const STATUS_VARIANT = {
  learning: 'info',
  ready: 'success',
  archived: 'neutral',
} as const;

const DIFFICULTY_VARIANT = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'error',
} as const;

function SongCardImpl({ personalSong, onPress, onFavoriteToggle, compact = false }: SongCardProps) {
  const { song, is_favorite, status, tags } = personalSong;
  if (!song) return null;

  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-start">
        <View className="flex-1 mr-2">
          <Text className="text-light-text-primary dark:text-text-primary font-semibold text-base" numberOfLines={1}>
            {song.title}
          </Text>
          {song.artist && (
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm mt-0.5" numberOfLines={1}>
              {song.artist}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onFavoriteToggle}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text className={`text-xl ${is_favorite ? 'text-secondary' : 'text-light-text-muted dark:text-text-muted'}`}>
            {is_favorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      {!compact && (
        <View className="flex-row flex-wrap gap-1.5 mt-2">
          {status && (
            <Badge
              label={status}
              variant={STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? 'neutral'}
            />
          )}
          {song.difficulty && (
            <Badge
              label={song.difficulty}
              variant={DIFFICULTY_VARIANT[song.difficulty] ?? 'neutral'}
            />
          )}
          {song.key && <Badge label={song.key} variant="primary" />}
          {song.bpm && <Badge label={`${song.bpm} BPM`} variant="neutral" />}
          {tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} label={tag} variant="neutral" />
          ))}
        </View>
      )}
    </Card>
  );
}

export const SongCard = React.memo(SongCardImpl, (prev, next) =>
  prev.personalSong.id === next.personalSong.id &&
  prev.personalSong.is_favorite === next.personalSong.is_favorite &&
  prev.personalSong.status === next.personalSong.status &&
  prev.personalSong.updated_at === next.personalSong.updated_at &&
  prev.compact === next.compact,
);
