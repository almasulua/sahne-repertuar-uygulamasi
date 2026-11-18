import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { loginSchema, type LoginFormValues } from '../../src/lib/validators/authSchema';
import { authApi } from '../../src/api/auth';
import { safeBack } from '../../src/lib/navigation';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await authApi.login(data);
      // Auth gate otomatik yönlendirecek
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.errors.loginFailed'));
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
          {/* Header */}
          <TouchableOpacity onPress={() => safeBack('/(auth)/welcome')} className="mb-8">
            <Text className="text-primary text-base">← {t('common.back')}</Text>
          </TouchableOpacity>

          <Text className="text-light-text-primary dark:text-text-primary text-3xl font-bold mb-2">
            {t('auth.login')}
          </Text>
          <Text className="text-light-text-secondary dark:text-text-secondary text-base mb-8">
            {t('auth.haveAccount')}
          </Text>

          {/* Form */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.email')}
                placeholder="ornek@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
                required
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
                autoComplete="current-password"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                required
                rightAction={{
                  icon: (
                    <Text className="text-light-text-muted dark:text-text-muted text-sm">
                      {showPassword ? '👁' : '👁‍🗨'}
                    </Text>
                  ),
                  onPress: () => setShowPassword(!showPassword),
                }}
              />
            )}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            className="self-end mb-6"
          >
            <Text className="text-primary text-sm">{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <Button
            label={t('auth.login')}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
          />

          {/* Register link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('auth.noAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-primary text-sm font-semibold">{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
