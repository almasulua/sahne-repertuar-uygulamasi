import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../stores/uiStore';

interface Slide {
  icon: string;
  titleKey: string;
  titleFallback: string;
  bodyKey: string;
  bodyFallback: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'M',
    titleKey: 'onboarding.slide1Title',
    titleFallback: 'Müzik App\'e hoş geldin',
    bodyKey: 'onboarding.slide1Body',
    bodyFallback:
      'Şarkılarını organize et, gruplarınla setlist hazırla, sahnede tek dokunuşla erişim sağla.',
  },
  {
    icon: 'R',
    titleKey: 'onboarding.slide2Title',
    titleFallback: 'Repertuar yönetimi',
    bodyKey: 'onboarding.slide2Body',
    bodyFallback:
      'Şarkılarını ChordPro formatında ekle, transpoze et, capo ile pratik pozisyonları gör.',
  },
  {
    icon: 'G',
    titleKey: 'onboarding.slide3Title',
    titleFallback: 'Grup işbirliği',
    bodyKey: 'onboarding.slide3Body',
    bodyFallback:
      'Davet linkiyle grup oluştur, ortak repertuar paylaş, anketlerle karar al, sohbet et.',
  },
  {
    icon: 'S',
    titleKey: 'onboarding.slide4Title',
    titleFallback: 'Sahne modu',
    bodyKey: 'onboarding.slide4Body',
    bodyFallback:
      'Setlist hazırla, sürükle-bırakla sırala, sahnede tam ekran swipe ile şarkılar arasında geç.',
  },
];

const { width: SCREEN_W } = Dimensions.get('window');

export function Onboarding() {
  const { t } = useTranslation();
  const onboardingCompleted = useUIStore((s) => s.onboardingCompleted);
  const setOnboardingCompleted = useUIStore((s) => s.setOnboardingCompleted);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = () => setOnboardingCompleted(true);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== index) setIndex(i);
  };

  if (onboardingCompleted) return null;

  const isLast = index === SLIDES.length - 1;

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
        <View className="flex-row justify-end px-4 pt-2">
          <TouchableOpacity onPress={finish} className="px-3 py-1.5">
            <Text className="text-light-text-muted dark:text-text-muted text-sm">
              {t('common.skip', 'Atla')}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => s.titleKey}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_W }} className="flex-1 items-center justify-center px-8">
              <View className="w-32 h-32 rounded-full bg-primary/15 items-center justify-center mb-8">
                <Text className="text-primary text-5xl font-bold">{item.icon}</Text>
              </View>
              <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold text-center mb-3">
                {t(item.titleKey, item.titleFallback)}
              </Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-base text-center leading-6">
                {t(item.bodyKey, item.bodyFallback)}
              </Text>
            </View>
          )}
        />

        {/* Dots */}
        <View className="flex-row justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${
                i === index ? 'bg-primary w-6' : 'bg-light-surface-3 dark:bg-surface-3 w-2'
              }`}
            />
          ))}
        </View>

        {/* Action */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={goNext}
            className="bg-primary py-3.5 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-base">
              {isLast
                ? t('onboarding.start', 'Başla')
                : t('common.next', 'Devam')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
