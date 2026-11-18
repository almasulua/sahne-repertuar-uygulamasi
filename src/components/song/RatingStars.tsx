import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

interface RatingStarsProps {
  value: number; // 0..5
  size?: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
}

/** 1–5 yıldız puanlama bileşeni. Read-only veya interaktif. */
export function RatingStars({ value, size = 24, readonly = false, onChange }: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5];

  const handlePress = (rating: number) => {
    if (readonly || !onChange) return;
    Haptics.selectionAsync();
    // İkinci kez aynı yıldıza basarsa toggle olarak 0'a düşür (clear)
    onChange(value === rating ? 0 : rating);
  };

  return (
    <View className="flex-row">
      {stars.map((n) => {
        const filled = n <= value;
        const star = (
          <Text style={{ fontSize: size, color: filled ? '#fbbf24' : '#3f3f46' }}>
            {filled ? '★' : '☆'}
          </Text>
        );
        if (readonly) {
          return <View key={n} className="mr-0.5">{star}</View>;
        }
        return (
          <TouchableOpacity
            key={n}
            onPress={() => handlePress(n)}
            hitSlop={8}
            className="mr-0.5"
            accessibilityRole="button"
            accessibilityLabel={`${n} yıldız`}
          >
            {star}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
