import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { groupSchema, type GroupFormValues } from '../../../src/lib/validators/groupSchema';
import { useCreateGroup } from '../../../src/hooks/useGroups';
import { useUIStore } from '../../../src/stores/uiStore';

export default function CreateGroupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createGroup = useCreateGroup();
  const showToast = useUIStore((s) => s.showToast);

  const { control, handleSubmit, formState: { errors } } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', description: '', genre: '' },
  });

  const onSubmit = async (data: GroupFormValues) => {
    try {
      const group = await createGroup.mutateAsync(data);
      showToast({ message: t('groups.createdSuccess'), type: 'success' });
      router.replace(`/(tabs)/groups/${group.id}`);
    } catch (e: unknown) {
      const msg = (e as any)?.message ?? JSON.stringify(e);
      Alert.alert(t('common.error'), msg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4 pb-8">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary text-base">← {t('common.back')}</Text>
            </TouchableOpacity>
            <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
              {t('groups.createGroup')}
            </Text>
          </View>

          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-light-surface-2 dark:bg-surface-2 border border-light-border dark:border-border rounded-2xl items-center justify-center">
              <Text className="text-5xl">👥</Text>
            </View>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('groups.groupName')}
                placeholder="Grubun adı"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('groups.groupDescription')}
                placeholder="Grup hakkında kısa bir açıklama..."
                multiline
                numberOfLines={3}
                value={value ?? ''}
                onChangeText={onChange}
                style={{ height: 80, textAlignVertical: 'top' }}
              />
            )}
          />

          <Controller
            control={control}
            name="genre"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('groups.groupGenre')}
                placeholder="Rock, Pop, Jazz..."
                value={value ?? ''}
                onChangeText={onChange}
              />
            )}
          />

          <Button
            label={t('groups.createGroup')}
            variant="primary"
            size="lg"
            fullWidth
            loading={createGroup.isPending}
            onPress={handleSubmit(onSubmit)}
            className="mt-4"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
