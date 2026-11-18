import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroup, useUpdateMemberRole, useRemoveMember } from '../../../../src/hooks/useGroups';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { Badge } from '../../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../../src/components/ui/LoadingSpinner';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useUIStore } from '../../../../src/stores/uiStore';
import type { GroupMember, GroupRole } from '../../../../src/types/group';
import { listPerfProps } from '../../../../src/lib/listPerf';

const ROLE_VARIANT: Record<GroupRole, 'primary' | 'info' | 'neutral'> = {
  owner: 'primary',
  admin: 'info',
  member: 'neutral',
};

export default function MembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { data: group, isLoading } = useGroup(groupId ?? null);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const showToast = useUIStore((s) => s.showToast);

  if (isLoading) return <LoadingSpinner fullscreen />;

  const myRole = group?.members?.find((m) => m.user_id === user?.id)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  const handleManage = (m: GroupMember) => {
    if (!groupId || !canManage) return;
    if (m.user_id === user?.id) return; // kendini düzenleme
    if (m.role === 'owner') return; // owner dokunulmaz
    if (myRole === 'admin' && m.role === 'admin') return; // admin başka admin'e dokunamaz

    const label = m.user?.display_name ?? m.user?.username ?? '?';
    const options = [];

    // Rol değiştirme — sadece owner için
    if (myRole === 'owner') {
      if (m.role !== 'admin') {
        options.push({
          text: t('groups.makeAdmin', 'Yönetici Yap'),
          onPress: async () => {
            try {
              await updateRole.mutateAsync({ groupId, userId: m.user_id, role: 'admin' });
              showToast({ message: t('groups.roleUpdated', 'Rol güncellendi'), type: 'success' });
            } catch {
              showToast({ message: t('errors.generic'), type: 'error' });
            }
          },
        });
      }
      if (m.role !== 'member') {
        options.push({
          text: t('groups.makeMember', 'Üye Yap'),
          onPress: async () => {
            try {
              await updateRole.mutateAsync({ groupId, userId: m.user_id, role: 'member' });
              showToast({ message: t('groups.roleUpdated', 'Rol güncellendi'), type: 'success' });
            } catch {
              showToast({ message: t('errors.generic'), type: 'error' });
            }
          },
        });
      }
    }

    options.push({
      text: t('groups.removeMember', 'Üyeyi Çıkar'),
      style: 'destructive' as const,
      onPress: () => {
        Alert.alert(
          t('groups.removeMember', 'Üyeyi Çıkar'),
          t('groups.removeMemberConfirm', '{{name}} gruptan çıkarılacak. Devam edilsin mi?', { name: label }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('groups.removeMember', 'Üyeyi Çıkar'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await removeMember.mutateAsync({ groupId, userId: m.user_id });
                  showToast({ message: t('groups.memberRemoved', 'Üye çıkarıldı'), type: 'success' });
                } catch {
                  showToast({ message: t('errors.generic'), type: 'error' });
                }
              },
            },
          ],
        );
      },
    });

    options.push({ text: t('common.cancel'), style: 'cancel' as const });
    Alert.alert(label, t('groups.changeMember', 'Üye işlemleri'), options);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('groups.members')} ({group?.members?.length ?? 0})
        </Text>
      </View>

      <FlatList
        {...listPerfProps}
        data={group?.members ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        renderItem={({ item }) => {
          const isMe = item.user_id === user?.id;
          const editable =
            canManage &&
            !isMe &&
            item.role !== 'owner' &&
            !(myRole === 'admin' && item.role === 'admin');
          return (
            <TouchableOpacity
              onPress={() =>
                editable
                  ? handleManage(item)
                  : router.push(`/user/${item.user_id}` as never)
              }
              activeOpacity={0.7}
              className="flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl px-3 py-3 mb-2 border border-light-border dark:border-border"
            >
              <Avatar
                uri={item.user?.avatar_url}
                name={item.user?.display_name ?? item.user?.username}
                size="sm"
              />
              <View className="flex-1 ml-3">
                <Text className="text-light-text-primary dark:text-text-primary font-medium">
                  {item.user?.display_name ?? item.user?.username ?? 'Bilinmeyen'}
                  {isMe && ` (${t('groups.you', 'siz')})`}
                </Text>
                {item.user?.username && (
                  <Text className="text-light-text-muted dark:text-text-muted text-xs">@{item.user.username}</Text>
                )}
              </View>
              <Badge label={t(`groups.${item.role}`, item.role)} variant={ROLE_VARIANT[item.role]} />
              {editable && <Text className="text-light-text-muted dark:text-text-muted text-base ml-2">›</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
