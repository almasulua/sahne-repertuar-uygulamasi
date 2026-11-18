import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RsvpStatus } from '../../types/event';

interface RsvpButtonProps {
  currentStatus?: RsvpStatus;
  onSelect: (status: RsvpStatus) => void;
  disabled?: boolean;
}

const RSVP_OPTIONS: { status: RsvpStatus; icon: string; colorActive: string; colorInactive: string }[] = [
  { status: 'attending', icon: '✓', colorActive: 'bg-green-600', colorInactive: 'bg-light-surface-2 dark:bg-surface-2' },
  { status: 'maybe', icon: '?', colorActive: 'bg-yellow-600', colorInactive: 'bg-light-surface-2 dark:bg-surface-2' },
  { status: 'not_attending', icon: '✕', colorActive: 'bg-red-600', colorInactive: 'bg-light-surface-2 dark:bg-surface-2' },
];

export function RsvpButton({ currentStatus, onSelect, disabled }: RsvpButtonProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-2">
      {RSVP_OPTIONS.map((opt) => {
        const isActive = currentStatus === opt.status;
        return (
          <TouchableOpacity
            key={opt.status}
            onPress={() => onSelect(opt.status)}
            disabled={disabled}
            className={`flex-1 py-3 rounded-xl items-center border ${
              isActive ? `${opt.colorActive} border-transparent` : `${opt.colorInactive} border-light-border dark:border-border`
            }`}
            activeOpacity={0.7}
          >
            <Text className={`text-lg ${isActive ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'}`}>
              {opt.icon}
            </Text>
            <Text className={`text-xs mt-0.5 ${isActive ? 'text-white' : 'text-light-text-muted dark:text-text-muted'}`}>
              {t(`event.${opt.status}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
