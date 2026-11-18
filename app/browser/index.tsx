import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InAppBrowser } from '../../src/components/browser/InAppBrowser';

export default function BrowserScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [extractedData, setExtractedData] = useState<{
    title: string;
    content: string;
    url: string;
  } | null>(null);

  const handleContentExtracted = (data: { title: string; content: string; url: string }) => {
    setExtractedData(data);
    // Önizleme ekranına yönlendir
    router.push({
      pathname: '/browser/preview',
      params: { title: data.title, content: data.content, url: data.url },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-2 pb-1">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold">{t('browser.title')}</Text>
      </View>
      <InAppBrowser onContentExtracted={handleContentExtracted} />
    </SafeAreaView>
  );
}
