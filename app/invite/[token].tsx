import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJoinGroup } from '../../src/hooks/useGroups';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Button } from '../../src/components/ui/Button';
import { useUIStore } from '../../src/stores/uiStore';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const joinGroup = useJoinGroup();
  const showToast = useUIStore((s) => s.showToast);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (token) handleJoin();
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;
    setJoining(true);
    try {
      const group = await joinGroup.mutateAsync(token);
      showToast({ message: t('groups.joinedSuccess'), type: 'success' });
      router.replace(`/(tabs)/groups/${group.id}` as never);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'already_member') {
        showToast({ message: t('groups.alreadyMember'), type: 'info' });
        router.replace('/(tabs)/groups');
      } else {
        Alert.alert(t('common.error'), t('groups.invalidInvite'));
        router.replace('/(tabs)/groups');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background items-center justify-center">
      {joining ? (
        <LoadingSpinner message={t('common.loading')} />
      ) : (
        <View className="items-center px-8">
          <Text className="text-5xl mb-4">👥</Text>
          <Text className="text-light-text-primary dark:text-text-primary text-xl font-semibold text-center mb-2">
            {t('groups.joinGroup')}
          </Text>
          <Button
            label={t('groups.joinGroup')}
            variant="primary"
            loading={joinGroup.isPending}
            onPress={handleJoin}
            className="mt-4"
          />
          <Button
            label={t('common.cancel')}
            variant="ghost"
            onPress={() => router.replace('/(tabs)/groups')}
            className="mt-2"
          />
        </View>
      )}
    </SafeAreaView>
  );
}
