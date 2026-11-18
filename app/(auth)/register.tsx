import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { registerSchema, type RegisterFormValues } from '../../src/lib/validators/authSchema';
import { authApi } from '../../src/api/auth';
import { safeBack } from '../../src/lib/navigation';
import { track } from '../../src/lib/analytics';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      displayName: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      await authApi.register({
        email: data.email,
        password: data.password,
        username: data.username,
        displayName: data.displayName,
      });
      track('register');
      // Auth gate yönlendirecek
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already registered')) {
        Alert.alert(t('common.error'), t('auth.errors.emailAlreadyUsed'));
      } else {
        Alert.alert(t('common.error'), msg || t('auth.errors.registerFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-8 pb-6">
          <TouchableOpacity onPress={() => safeBack('/(auth)/welcome')} className="mb-8">
            <Text className="text-primary text-base">← {t('common.back')}</Text>
          </TouchableOpacity>

          <Text className="text-light-text-primary dark:text-text-primary text-3xl font-bold mb-2">
            {t('auth.register')}
          </Text>
          <Text className="text-light-text-secondary dark:text-text-secondary text-base mb-8">
            Müzik dünyasına katılın
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.email')}
                placeholder="ornek@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.username')}
                placeholder="kullaniciadi"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={errors.username?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.displayName')}
                placeholder="Adınız Soyadınız"
                value={value}
                onChangeText={onChange}
                error={errors.displayName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.password')}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                required
                rightAction={{
                  icon: <Text className="text-light-text-muted dark:text-text-muted text-sm">{showPassword ? '👁' : '👁‍🗨'}</Text>,
                  onPress: () => setShowPassword(!showPassword),
                }}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.confirmPassword')}
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                required
              />
            )}
          />

          <Button
            label={t('auth.register')}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('auth.haveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-primary text-sm font-semibold">{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
