import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: boolean | number;
  className?: string;
  style?: ViewStyle;
}

/** Shimmer/pulse animasyonlu placeholder kutusu */
export function Skeleton({ width = '100%', height = 16, rounded = 8, className, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0.4, 1], [0.4, 0.85]),
  }));

  const radius = typeof rounded === 'number' ? rounded : rounded ? 999 : 0;

  return (
    <Animated.View
      className={`bg-light-surface-3 dark:bg-surface-3 ${className ?? ''}`}
      style={[
        {
          width: width as number | `${number}%`,
          height,
          borderRadius: radius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Şarkı listesi için satır iskeleti */
export function SongRowSkeleton() {
  return (
    <View className="flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 mb-2 border border-light-border dark:border-border">
      <View className="flex-1 gap-1.5">
        <Skeleton width="70%" height={14} rounded={6} />
        <Skeleton width="45%" height={11} rounded={6} />
      </View>
      <Skeleton width={32} height={20} rounded={10} />
    </View>
  );
}

/** Grup kartı için iskelet */
export function GroupCardSkeleton() {
  return (
    <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl p-4 mb-3 border border-light-border dark:border-border">
      <View className="flex-row items-center">
        <Skeleton width={48} height={48} rounded={24} />
        <View className="flex-1 ml-3 gap-1.5">
          <Skeleton width="60%" height={16} rounded={6} />
          <Skeleton width="40%" height={11} rounded={6} />
        </View>
      </View>
    </View>
  );
}

/** Aktivite/sohbet satırı için iskelet */
export function ActivityRowSkeleton() {
  return (
    <View className="flex-row items-start bg-light-surface-2 dark:bg-surface-2 rounded-xl px-3 py-3 mb-2 border border-light-border dark:border-border">
      <Skeleton width={32} height={32} rounded={16} />
      <View className="flex-1 ml-3 gap-1.5">
        <Skeleton width="40%" height={12} rounded={6} />
        <Skeleton width="85%" height={13} rounded={6} />
      </View>
    </View>
  );
}

/** Bir liste boyunca tekrarlanan iskelet */
export function SkeletonList({
  count = 6,
  Item = SongRowSkeleton,
}: {
  count?: number;
  Item?: React.ComponentType;
}) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </View>
  );
}
