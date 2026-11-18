import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { usePersonalSongs } from '../../../src/hooks/useSongs';
import { useMyGroups } from '../../../src/hooks/useGroups';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import { authApi } from '../../../src/api/auth';
import { useUIStore } from '../../../src/stores/uiStore';
import { ToastContainer } from '../../../src/components/ui/Toast';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
  professional: 'Profesyonel',
};

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { data: songs } = usePersonalSongs();
  const { data: groups } = useMyGroups();
  const { locale, setLocale, setOnboardingCompleted, theme, setTheme } = useUIStore();

  const handleLogout = () => {
    Alert.alert('Çıkış', 'Hesabınızdan çıkmak istediğinizden emin misiniz?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await authApi.logout();
        },
      },
    ]);
  };

  const toggleLanguage = () => {
    const newLocale = locale === 'tr' ? 'en' : 'tr';
    setLocale(newLocale);
    i18n.changeLanguage(newLocale);
  };

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-2">
          <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold flex-1">
            {t('profile.title')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile/edit')}
            className="bg-light-surface-2 dark:bg-surface-2 px-3 py-1.5 rounded-lg border border-light-border dark:border-border"
          >
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('profile.editProfile')}</Text>
          </TouchableOpacity>
        </View>

        {/* Kullanıcı Bilgisi */}
        <View className="items-center px-4 py-6">
          <Avatar uri={user.avatar_url} name={user.display_name ?? user.username} size="xl" />
          <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold mt-3">
            {user.display_name ?? user.username}
          </Text>
          <Text className="text-light-text-muted dark:text-text-muted text-sm mt-0.5">@{user.username}</Text>
          {user.level && (
            <Badge
              label={LEVEL_LABELS[user.level] ?? user.level}
              variant="primary"
              size="md"
            />
          )}
        </View>

        {/* İstatistikler */}
        <View className="flex-row mx-4 mb-6 gap-4">
          {[
            { label: t('profile.stats.songs'), value: songs?.length ?? 0, icon: '🎵' },
            { label: t('profile.stats.groups'), value: groups?.length ?? 0, icon: '👥' },
          ].map((stat) => (
            <View
              key={stat.label}
              className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-2xl py-4 items-center border border-light-border dark:border-border"
            >
              <Text className="text-2xl mb-1">{stat.icon}</Text>
              <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold">{stat.value}</Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Enstrümanlar */}
        {user.instruments && user.instruments.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">
              {t('profile.instruments')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {user.instruments.map((inst) => (
                <Badge key={inst} label={inst} variant="primary" />
              ))}
            </View>
          </View>
        )}

        {/* Ayarlar */}
        <View className="mx-4 mb-8">
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-3">
            {t('profile.settings.title')}
          </Text>

          <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl border border-light-border dark:border-border overflow-hidden">
            {/* İstatistikler */}
            <TouchableOpacity
              onPress={() => router.push('/stats' as never)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text>📊</Text>
                <Text className="text-light-text-primary dark:text-text-primary">{t('profile.settings.stats', 'İstatistikler')}</Text>
              </View>
              <Text className="text-light-text-muted dark:text-text-muted text-base">›</Text>
            </TouchableOpacity>

            {/* Kullanıcı Ara */}
            <TouchableOpacity
              onPress={() => router.push('/users' as never)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text>🔍</Text>
                <Text className="text-light-text-primary dark:text-text-primary">{t('userSearch.title', 'Kullanıcı Ara')}</Text>
              </View>
              <Text className="text-light-text-muted dark:text-text-muted text-base">›</Text>
            </TouchableOpacity>

            {/* Müzisyen Eşleştirme */}
            <TouchableOpacity
              onPress={() => router.push('/matches' as never)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text>🎸</Text>
                <Text className="text-light-text-primary dark:text-text-primary">{t('matches.title', 'Müzisyen Önerileri')}</Text>
              </View>
              <Text className="text-light-text-muted dark:text-text-muted text-base">›</Text>
            </TouchableOpacity>

            {/* Bluetooth Pedal */}
            <TouchableOpacity
              onPress={() => router.push('/pedal-settings' as never)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text>🦶</Text>
                <Text className="text-light-text-primary dark:text-text-primary">{t('pedal.title', 'Bluetooth Pedal')}</Text>
              </View>
              <Text className="text-light-text-muted dark:text-text-muted text-base">›</Text>
            </TouchableOpacity>

            {/* Dil */}
            <TouchableOpacity
              onPress={toggleLanguage}
              className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text>🌐</Text>
                <Text className="text-light-text-primary dark:text-text-primary">{t('profile.settings.language')}</Text>
              </View>
              <Text className="text-light-text-secondary dark:text-text-secondary text-sm">
                {locale === 'tr' ? 'Türkçe' : 'English'}
              </Text>
            </TouchableOpacity>

            {/* Tema */}
            <View className="px-4 py-3 border-b border-light-border dark:border-border">
              <View className="flex-row items-center gap-3 mb-2">
                <Text>🎨</Text>
                <Text className="text-light-text-primary dark:text-text-primary">{t('profile.settings.theme', 'Tema')}</Text>
              </View>
              <View className="flex-row gap-2">
                {(['system', 'light', 'dark'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setTheme(option)}
                    className={`flex-1 py-2 rounded-lg items-center border ${
                      theme === option
                        ? 'bg-primary border-primary'
                        : 'bg-light-surface dark:bg-surface border-light-border-light dark:border-border-light'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        theme === option ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'
                      }`}
                    >
                      {t(`profile.settings.theme_${option}`,
                        option === 'system' ? 'Sistem' : option === 'light' ? 'Açık' : 'Koyu')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Onboarding'i tekrar göster */}
            <TouchableOpacity
              onPress={() => setOnboardingCompleted(false)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text>👋</Text>
                <Text className="text-light-text-primary dark:text-text-primary">
                  {t('profile.settings.replayOnboarding', 'Tanıtımı tekrar göster')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Çıkış */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center px-4 py-3 gap-3"
            >
              <Text>🚪</Text>
              <Text className="text-error font-medium">{t('auth.logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ToastContainer />
    </SafeAreaView>
  );
}
