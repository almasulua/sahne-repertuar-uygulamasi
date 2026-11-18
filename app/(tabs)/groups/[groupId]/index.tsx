import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useGroup, useLeaveGroup, useDeleteGroup } from '../../../../src/hooks/useGroups';
import { LoadingSpinner } from '../../../../src/components/ui/LoadingSpinner';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { Badge } from '../../../../src/components/ui/Badge';
import { InviteQRModal } from '../../../../src/components/group/InviteQRModal';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useUIStore } from '../../../../src/stores/uiStore';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { data: group, isLoading } = useGroup(groupId ?? null);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const showToast = useUIStore((s) => s.showToast);
  const [qrVisible, setQrVisible] = useState(false);

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (!group) return null;

  const myRole = group.members?.find((m) => m.user_id === user?.id)?.role;
  const isOwner = myRole === 'owner';
  const inviteUrl = `muzikapp://invite/${group.invite_token}`;

  const handleCopyInvite = async () => {
    await Clipboard.setStringAsync(inviteUrl);
    showToast({ message: t('groups.inviteCopied'), type: 'success' });
  };

  const handleLeave = () => {
    Alert.alert(t('groups.leaveGroup'), t('groups.leaveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.leaveGroup'),
        style: 'destructive',
        onPress: async () => {
          await leaveGroup.mutateAsync(group.id);
          showToast({ message: t('groups.leftSuccess'), type: 'info' });
          router.replace('/(tabs)/groups');
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(t('groups.deleteGroup'), t('groups.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.deleteGroup'),
        style: 'destructive',
        onPress: async () => {
          await deleteGroup.mutateAsync(group.id);
          router.replace('/(tabs)/groups');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-primary text-xl">←</Text>
          </TouchableOpacity>
          <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1" numberOfLines={1}>
            {group.name}
          </Text>
        </View>

        {/* Grup Bilgisi */}
        <View className="items-center px-4 py-6">
          <Avatar uri={group.avatar_url} name={group.name} size="xl" />
          <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold mt-3">{group.name}</Text>
          {group.description && (
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm text-center mt-1 px-8">
              {group.description}
            </Text>
          )}
          <View className="flex-row gap-2 mt-2">
            {group.genre && <Badge label={group.genre} variant="primary" />}
            <Badge label={`${group.members?.length ?? 0} ${t('groups.members')}`} variant="neutral" />
            {myRole && (
              <Badge
                label={t(`groups.${myRole}`)}
                variant={myRole === 'owner' ? 'primary' : myRole === 'admin' ? 'info' : 'neutral'}
              />
            )}
          </View>
        </View>

        {/* Hızlı Eylemler */}
        <View className="flex-row mx-4 gap-3 mb-3">
          {[
            { icon: '💬', label: t('groups.chat'), route: `/(tabs)/groups/${groupId}/chat` },
            { icon: '👥', label: t('groups.members'), route: `/(tabs)/groups/${groupId}/members` },
            ...(isOwner || myRole === 'admin'
              ? [{ icon: '⚙️', label: t('groups.settings'), route: `/(tabs)/groups/${groupId}/settings` }]
              : []),
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as never)}
              className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-2xl py-4 items-center border border-light-border dark:border-border"
            >
              <Text className="text-2xl mb-1">{item.icon}</Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs font-medium">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Faz 2 Eylemler */}
        <View className="flex-row flex-wrap mx-4 gap-3 mb-6">
          {[
            { icon: '🎸', label: t('groups.repertoire'), route: `/(tabs)/groups/${groupId}/repertoire` },
            { icon: '🎵', label: t('setlist.title'), route: `/(tabs)/groups/${groupId}/setlists` },
            { icon: '📊', label: t('poll.title'), route: `/(tabs)/groups/${groupId}/polls` },
            { icon: '📅', label: t('event.title'), route: `/(tabs)/groups/${groupId}/events` },
            { icon: '🪵', label: t('activity.title', 'Aktivite'), route: `/(tabs)/groups/${groupId}/activity` },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as never)}
              className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-2xl py-4 items-center border border-light-border dark:border-border"
            >
              <Text className="text-2xl mb-1">{item.icon}</Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs font-medium">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Davet Linki */}
        <View className="mx-4 bg-light-surface-2 dark:bg-surface-2 rounded-2xl p-4 mb-4 border border-light-border dark:border-border">
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">
            {t('groups.inviteLink')}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-light-text-muted dark:text-text-muted text-xs flex-1 font-mono" numberOfLines={1}>
              {inviteUrl}
            </Text>
            <TouchableOpacity
              onPress={() => setQrVisible(true)}
              className="ml-2 bg-light-surface-3 dark:bg-surface-3 px-3 py-1.5 rounded-lg border border-light-border dark:border-border"
            >
              <Text className="text-light-text-primary dark:text-text-primary text-xs font-medium">QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCopyInvite}
              className="ml-2 bg-primary px-3 py-1.5 rounded-lg"
            >
              <Text className="text-white text-xs font-medium">{t('common.copy')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ayrıl / Sil */}
        <View className="mx-4 mb-8 gap-2">
          {!isOwner && (
            <TouchableOpacity
              onPress={handleLeave}
              className="py-3 border border-error rounded-xl items-center"
            >
              <Text className="text-error font-medium">{t('groups.leaveGroup')}</Text>
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity
              onPress={handleDelete}
              className="py-3 border border-error rounded-xl items-center"
            >
              <Text className="text-error font-medium">{t('groups.deleteGroup')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <InviteQRModal
        visible={qrVisible}
        inviteUrl={inviteUrl}
        groupName={group.name}
        onClose={() => setQrVisible(false)}
      />
    </SafeAreaView>
  );
}
