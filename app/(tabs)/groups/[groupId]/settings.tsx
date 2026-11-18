import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroup, useUpdateGroup } from '../../../../src/hooks/useGroups';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../../src/components/ui/LoadingSpinner';
import { groupSchema, type GroupFormValues } from '../../../../src/lib/validators/groupSchema';
import { useUIStore } from '../../../../src/stores/uiStore';

export default function GroupSettingsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: group, isLoading } = useGroup(groupId ?? null);
  const updateGroup = useUpdateGroup();
  const showToast = useUIStore((s) => s.showToast);
  const mutedGroupIds = useUIStore((s) => s.mutedGroupIds);
  const toggleMutedGroup = useUIStore((s) => s.toggleMutedGroup);
  const isMuted = !!groupId && mutedGroupIds.includes(groupId);

  const { control, handleSubmit, formState: { errors } } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    values: group ? { name: group.name, description: group.description ?? '', genre: group.genre ?? '' } : undefined,
  });

  const onSubmit = async (data: GroupFormValues) => {
    if (!groupId) return;
    try {
      await updateGroup.mutateAsync({ id: groupId, ...data });
      showToast({ message: t('groups.updated', 'Grup güncellendi'), type: 'success' });
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-4 pt-4 pb-8">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary text-base">← {t('common.back')}</Text>
            </TouchableOpacity>
            <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
              {t('groups.settings')}
            </Text>
          </View>

          {/* Hızlı erişim */}
          <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl border border-light-border dark:border-border overflow-hidden mb-6">
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/groups/${groupId}/members` as never)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text>👥</Text>
                <Text className="text-light-text-primary dark:text-text-primary">
                  {t('groups.manageMembers', 'Üyeleri Yönet')}
                </Text>
              </View>
              <Text className="text-light-text-muted dark:text-text-muted">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/groups/${groupId}/activity` as never)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text>🪵</Text>
                <Text className="text-light-text-primary dark:text-text-primary">{t('activity.title', 'Aktivite')}</Text>
              </View>
              <Text className="text-light-text-muted dark:text-text-muted">›</Text>
            </TouchableOpacity>

            {/* Bildirim sustur toggle */}
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center gap-3 flex-1 mr-3">
                <Text>{isMuted ? '🔕' : '🔔'}</Text>
                <View className="flex-1">
                  <Text className="text-light-text-primary dark:text-text-primary">
                    {t('groups.muteNotifications', 'Bildirimleri sustur')}
                  </Text>
                  <Text className="text-light-text-muted dark:text-text-muted text-xs mt-0.5">
                    {t(
                      'groups.muteNotificationsHint',
                      'Bu grubun push bildirimleri gelmeyecek (cihaz bazında).',
                    )}
                  </Text>
                </View>
              </View>
              <Switch
                value={isMuted}
                onValueChange={() => {
                  if (groupId) toggleMutedGroup(groupId);
                }}
                trackColor={{ false: '#3e3e3e', true: '#6C63FF' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Grup bilgileri */}
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">
            {t('groups.groupInfo', 'Grup Bilgileri')}
          </Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('groups.groupName')}
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
                value={value ?? ''}
                onChangeText={onChange}
              />
            )}
          />

          <Button
            label={t('common.save')}
            variant="primary"
            size="lg"
            fullWidth
            loading={updateGroup.isPending}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
