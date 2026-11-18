import React from 'react';
import { View, TouchableOpacity, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  onPress?: () => void;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING_CLASSES = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({ onPress, elevated, padding = 'md', children, className, ...rest }: CardProps) {
  const baseClass = [
    'bg-light-surface dark:bg-surface rounded-2xl',
    elevated
      ? 'border border-light-border-light dark:border-border-light'
      : 'border border-light-border dark:border-border',
    PADDING_CLASSES[padding],
    className ?? '',
  ].join(' ');

  if (onPress) {
    return (
      <TouchableOpacity className={baseClass} onPress={onPress} activeOpacity={0.7} {...(rest as object)}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClass} {...rest}>
      {children}
    </View>
  );
}
