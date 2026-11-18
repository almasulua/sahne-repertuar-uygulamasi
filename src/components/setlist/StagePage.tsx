import React from 'react';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

interface StagePageProps {
  index: number;
  width: number;
  /** Yatay FlatList'in canlı scroll offset'i (UI thread) */
  scrollX: SharedValue<number>;
  /** Sistem "hareketi azalt" açıksa efekt uygulanmaz */
  reduceMotion: boolean;
  children: React.ReactNode;
}

/**
 * Sahne modunda her şarkı sayfasını saran animasyonlu kap.
 * Swipe sırasında sayfa merkezden uzaklaştıkça hafifçe küçülür ve solar
 * (derinlik hissi). Tamamen scroll offset'ine bağlı
 * olduğu için parmak hareketini birebir takip eder (gecikme/zıplama yok).
 */
export function StagePage({ index, width, scrollX, reduceMotion, children }: StagePageProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion || width === 0) return {};
    // -1: sayfa solda, 0: tam ekranda, 1: sayfa sağda
    const position = (index * width - scrollX.value) / width;
    const range = [-1, 0, 1];
    return {
      opacity: interpolate(position, range, [0.35, 1, 0.35], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(position, range, [0.92, 1, 0.92], Extrapolation.CLAMP) },
      ],
    };
  }, [index, width, reduceMotion]);

  return <Animated.View style={[{ width, flex: 1 }, animatedStyle]}>{children}</Animated.View>;
}
