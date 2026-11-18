import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePublicUser } from '../../src/hooks/useProfile';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function PublicUserScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: user, isLoading } = usePublicUser(userId ?? null);

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('userProfile.title', 'Profil')}
        </Text>
      </View>

      {!user ? (
        <EmptyState
          title={t('userProfile.notFound', 'Kullanıcı bulunamadı')}
          subtitle={t('userProfile.notFoundHint', 'Bu kullanıcı silinmiş veya erişim yok olabilir.')}
          icon="👤"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="items-center px-4 py-6">
            <Avatar uri={user.avatar_url} name={user.display_name ?? user.username} size="xl" />
            <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold mt-3">
              {user.display_name ?? user.username}
            </Text>
            <Text className="text-light-text-muted dark:text-text-muted text-sm mt-0.5">@{user.username}</Text>
            {user.level && (
              <Badge
                label={t(`profile.${user.level}`, user.level)}
                variant="primary"
                size="md"
              />
            )}
          </View>

          {user.instruments?.length > 0 && (
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

          {user.genres?.length > 0 && (
            <View className="mx-4 mb-4">
              <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">
                {t('profile.genres')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {user.genres.map((g) => (
                  <Badge key={g} label={g} variant="neutral" />
                ))}
              </View>
            </View>
          )}

          <View className="mx-4 my-6">
            <View className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 border border-light-border dark:border-border">
              <Text className="text-light-text-muted dark:text-text-muted text-xs">
                {t('userProfile.memberSince', 'Üyelik')}
              </Text>
              <Text className="text-light-text-primary dark:text-text-primary text-sm mt-0.5">
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
