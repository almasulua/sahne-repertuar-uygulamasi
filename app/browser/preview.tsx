import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChordPreview } from '../../src/components/browser/ChordPreview';
import { useCreateSong } from '../../src/hooks/useSongs';
import { useUIStore } from '../../src/stores/uiStore';

export default function BrowserPreviewScreen() {
  const { title, content, url } = useLocalSearchParams<{
    title: string;
    content: string;
    url: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();
  const createSong = useCreateSong();
  const showToast = useUIStore((s) => s.showToast);

  const handleSave = async (data: {
    title: string;
    artist: string;
    lyrics: string;
    source_url: string;
  }) => {
    try {
      await createSong.mutateAsync({
        title: data.title,
        artist: data.artist || undefined,
        lyrics: data.lyrics,
        source_url: data.source_url,
        personalStatus: 'learning',
      });
      showToast({ message: t('repertoire.addedSuccess'), type: 'success' });
      router.replace('/(tabs)/repertoire');
    } catch {
      showToast({ message: t('errors.generic'), type: 'error' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-2 pb-1">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold">{t('browser.preview')}</Text>
      </View>
      <ChordPreview
        rawContent={content ?? ''}
        pageTitle={title ?? ''}
        sourceUrl={url ?? ''}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
