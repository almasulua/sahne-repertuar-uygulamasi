import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}

export function Header({ title, subtitle, showBack = false, rightElement, onBack }: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center px-4 py-3 bg-light-background dark:bg-background border-b border-light-border dark:border-border">
      {showBack && (
        <TouchableOpacity
          onPress={handleBack}
          className="mr-3 w-8 h-8 items-center justify-center"
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text className="text-primary text-2xl">←</Text>
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-light-text-secondary dark:text-text-secondary text-xs" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && <View className="ml-3">{rightElement}</View>}
    </View>
  );
}
