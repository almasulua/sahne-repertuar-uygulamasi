import React from 'react';
import { View, Text } from 'react-native';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-primary/20',
  success: 'bg-success/20',
  warning: 'bg-warning/20',
  error: 'bg-error/20',
  info: 'bg-info/20',
  neutral: 'bg-light-surface-3 dark:bg-surface-3',
};

const VARIANT_TEXT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  neutral: 'text-light-text-secondary dark:text-text-secondary',
};

export function Badge({ label, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View className={`${VARIANT_CLASSES[variant]} ${sizeClass} rounded-full self-start`}>
      <Text className={`${VARIANT_TEXT_CLASSES[variant]} ${textSize} font-medium`}>{label}</Text>
    </View>
  );
}
