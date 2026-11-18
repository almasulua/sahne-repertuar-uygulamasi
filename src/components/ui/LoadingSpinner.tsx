import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullscreen?: boolean;
}

export function LoadingSpinner({ message, size = 'large', fullscreen = false }: LoadingSpinnerProps) {
  const content = (
    <View className="items-center gap-3">
      <ActivityIndicator size={size} color="#6C63FF" />
      {message && <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{message}</Text>}
    </View>
  );

  if (fullscreen) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-background">{content}</View>
    );
  }

  return <View className="py-8 items-center">{content}</View>;
}
