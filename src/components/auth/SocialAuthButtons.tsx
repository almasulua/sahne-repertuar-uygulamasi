import React, { useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { authApi, type OAuthProvider } from '../../api/auth';
import { track } from '../../lib/analytics';

interface SocialAuthButtonsProps {
  /** Butonların üstünde "veya" ayırıcısı gösterilsin mi (form altındaysa true) */
  showDivider?: boolean;
}

/**
 * Google / Apple ile giriş butonları.
 * Apple butonu yalnızca iOS'ta gösterilir (App Store kuralı: üçüncü taraf girişi
 * sunan iOS uygulamaları Apple ile girişi de sunmalı; Android'de beklenmez).
 * Başarılı girişte yönlendirmeyi auth gate yapar.
 */
export function SocialAuthButtons({ showDivider = false }: SocialAuthButtonsProps) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const handlePress = async (provider: OAuthProvider) => {
    if (pending) return;
    try {
      setPending(provider);
      const result = await authApi.signInWithOAuth(provider);
      if (result) track('login', { method: provider });
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.errors.oauthFailed'));
    } finally {
      setPending(null);
    }
  };

  return (
    <View className="w-full">
      {showDivider && (
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-light-border dark:bg-border" />
          <Text className="mx-3 text-light-text-muted dark:text-text-muted text-xs">
            {t('auth.or')}
          </Text>
          <View className="flex-1 h-px bg-light-border dark:bg-border" />
        </View>
      )}
      <View className="gap-3">
        <Button
          label={t('auth.loginWithGoogle')}
          variant="secondary"
          size="lg"
          fullWidth
          loading={pending === 'google'}
          disabled={pending !== null}
          leftIcon={<Text className="text-base font-bold text-light-text-primary dark:text-text-primary">G</Text>}
          onPress={() => handlePress('google')}
        />
        {Platform.OS === 'ios' && (
          <Button
            label={t('auth.loginWithApple')}
            variant="secondary"
            size="lg"
            fullWidth
            loading={pending === 'apple'}
            disabled={pending !== null}
            leftIcon={<Text className="text-base text-light-text-primary dark:text-text-primary"></Text>}
            onPress={() => handlePress('apple')}
          />
        )}
      </View>
    </View>
  );
}
