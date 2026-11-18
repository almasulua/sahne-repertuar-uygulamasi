import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center mb-12">
          <Text className="text-7xl mb-4">🎵</Text>
          <Text className="text-light-text-primary dark:text-text-primary text-3xl font-bold text-center">
            {t('common.appName')}
          </Text>
          <Text className="text-light-text-secondary dark:text-text-secondary text-base text-center mt-2">
            {t('auth.welcomeSubtitle')}
          </Text>
        </View>

        <View className="w-full gap-3">
          <Button
            label={t('auth.login')}
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/login')}
          />
          <Button
            label={t('auth.register')}
            variant="outline"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
          />
        </View>
      </View>

      <View className="pb-8 items-center">
        <Text className="text-light-text-muted dark:text-text-muted text-xs">
          {t('common.appName')} v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
