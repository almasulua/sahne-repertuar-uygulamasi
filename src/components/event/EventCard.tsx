import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/Badge';
import type { EventWithRsvps } from '../../types/event';

interface EventCardProps {
  event: EventWithRsvps;
  onPress: () => void;
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_VARIANT = {
  upcoming: 'primary',
  cancelled: 'neutral',
  completed: 'neutral',
} as const;

export function EventCard({ event, onPress }: EventCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl p-4 mb-3 border border-light-border dark:border-border"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-1">
        <Text className="text-light-text-primary dark:text-text-primary font-bold text-base flex-1" numberOfLines={1}>
          {event.title}
        </Text>
        <Badge label={t(`event.${event.status}`)} variant={STATUS_VARIANT[event.status]} />
      </View>

      <Text className="text-primary text-sm font-medium mb-1">
        📅 {formatEventDate(event.event_date)}
      </Text>

      {event.venue && (
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm mb-2">📍 {event.venue}</Text>
      )}

      {/* RSVP özeti */}
      <View className="flex-row gap-3">
        <Text className="text-green-500 text-xs">
          ✓ {event.rsvp_counts.attending}
        </Text>
        <Text className="text-yellow-500 text-xs">
          ? {event.rsvp_counts.maybe}
        </Text>
        <Text className="text-red-400 text-xs">
          ✕ {event.rsvp_counts.not_attending}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
