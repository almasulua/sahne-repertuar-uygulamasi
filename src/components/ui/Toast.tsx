import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import type { Toast as ToastType } from '../../stores/uiStore';
import { useUIStore } from '../../stores/uiStore';

const ICON: Record<ToastType['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const BG: Record<ToastType['type'], string> = {
  success: 'bg-success',
  error: 'bg-error',
  info: 'bg-info',
  warning: 'bg-warning',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const hideToast = useUIStore((s) => s.hideToast);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(toast.duration ?? 3000),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => hideToast(toast.id));
  }, []);

  return (
    <Animated.View
      style={{ opacity }}
      className={`flex-row items-center ${BG[toast.type]} mx-4 mb-2 px-4 py-3 rounded-xl`}
    >
      <Text className="text-white font-bold mr-2">{ICON[toast.type]}</Text>
      <Text className="text-white text-sm flex-1">{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View className="absolute bottom-24 left-0 right-0 z-50">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}
