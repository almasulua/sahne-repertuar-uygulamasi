import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export function EmptyState({ title, subtitle, actionLabel, onAction, icon = '🎵' }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-5xl mb-4">{icon}</Text>
      <Text className="text-light-text-primary dark:text-text-primary text-xl font-semibold text-center mb-2">{title}</Text>
      {subtitle && (
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm text-center mb-6">{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="primary" />
      )}
    </View>
  );
}
