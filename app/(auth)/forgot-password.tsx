import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../src/lib/validators/authSchema';
import { authApi } from '../../src/api/auth';
import { safeBack } from '../../src/lib/navigation';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      await authApi.sendPasswordReset(email);
      setSent(true);
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-1 px-6 pt-8">
        <TouchableOpacity onPress={() => safeBack('/(auth)/welcome')} className="mb-8">
          <Text className="text-primary text-base">← {t('common.back')}</Text>
        </TouchableOpacity>

        <Text className="text-light-text-primary dark:text-text-primary text-3xl font-bold mb-2">
          {t('auth.forgotPassword')}
        </Text>

        {sent ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-5xl mb-4">📧</Text>
            <Text className="text-light-text-primary dark:text-text-primary text-xl font-semibold text-center mb-2">
              {t('auth.resetPasswordSent')}
            </Text>
            <Button
              label={t('auth.login')}
              variant="primary"
              onPress={() => router.replace('/(auth)/login')}
              className="mt-6"
            />
          </View>
        ) : (
          <>
            <Text className="text-light-text-secondary dark:text-text-secondary text-base mb-8">
              E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
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
            <Button
              label={t('auth.resetPassword')}
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              onPress={handleSubmit(onSubmit)}
              className="mt-2"
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
