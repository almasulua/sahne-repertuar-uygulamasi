import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';
import { useAuth } from '../../../src/hooks/useAuth';
import { useUpdateProfile } from '../../../src/hooks/useProfile';
import { useUIStore } from '../../../src/stores/uiStore';

const profileEditSchema = z.object({
  display_name: z.string().max(100).optional(),
  username: z
    .string()
    .min(3, 'En az 3 karakter')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve _'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
});

type ProfileEditValues = z.infer<typeof profileEditSchema>;

const LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'] as const;
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
  professional: 'Profesyonel',
};

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const showToast = useUIStore((s) => s.showToast);

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      display_name: user?.display_name ?? '',
      username: user?.username ?? '',
      level: user?.level ?? undefined,
    },
  });

  const onSubmit = async (data: ProfileEditValues) => {
    try {
      await updateProfile.mutateAsync(data);
      showToast({ message: t('profile.savedSuccess'), type: 'success' });
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4 pb-8">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary text-base">← {t('common.back')}</Text>
            </TouchableOpacity>
            <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
              {t('profile.editProfile')}
            </Text>
          </View>

          {/* Avatar */}
          <View className="items-center mb-6">
            <Avatar
              uri={user?.avatar_url}
              name={user?.display_name ?? user?.username}
              size="xl"
            />
            <TouchableOpacity className="mt-2">
              <Text className="text-primary text-sm">{t('profile.changeAvatar')}</Text>
            </TouchableOpacity>
          </View>

          <Controller
            control={control}
            name="display_name"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('profile.displayName')}
                placeholder="Adınız Soyadınız"
                value={value ?? ''}
                onChangeText={onChange}
                error={errors.display_name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('profile.username')}
                placeholder="kullaniciadi"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={errors.username?.message}
                required
              />
            )}
          />

          {/* Seviye */}
          <View className="mb-4">
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">
              {t('profile.level')}
            </Text>
            <Controller
              control={control}
              name="level"
              render={({ field: { onChange, value } }) => (
                <View className="gap-2">
                  {LEVELS.map((l) => (
                    <TouchableOpacity
                      key={l}
                      onPress={() => onChange(l)}
                      className={[
                        'py-2.5 px-4 rounded-xl border flex-row items-center justify-between',
                        value === l ? 'bg-primary/20 border-primary' : 'border-light-border dark:border-border bg-light-surface-2 dark:bg-surface-2',
                      ].join(' ')}
                    >
                      <Text className={value === l ? 'text-primary font-semibold' : 'text-light-text-secondary dark:text-text-secondary'}>
                        {LEVEL_LABELS[l]}
                      </Text>
                      {value === l && <Text className="text-primary">✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          <Button
            label={t('common.save')}
            variant="primary"
            size="lg"
            fullWidth
            loading={updateProfile.isPending}
            onPress={handleSubmit(onSubmit)}
            className="mt-4"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
