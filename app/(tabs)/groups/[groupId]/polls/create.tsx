import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreatePoll } from '../../../../../src/hooks/usePolls';
import { useSendMessage } from '../../../../../src/hooks/useMessages';
import { PollCreateForm } from '../../../../../src/components/poll/PollCreateForm';
import { useUIStore } from '../../../../../src/stores/uiStore';

export default function CreatePollScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const createPoll = useCreatePoll();
  const sendMessage = useSendMessage(groupId ?? '');
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = async (data: Parameters<typeof createPoll.mutateAsync>[0] extends infer T ? Omit<T, 'group_id'> : never) => {
    if (!groupId) return;
    try {
      const poll = await createPoll.mutateAsync({ ...data, group_id: groupId });
      // Chat'e poll mesajı gönder (başarısız olursa da devam et)
      try {
        await sendMessage.mutateAsync({
          content: `📊 ${data.question}`,
          type: 'poll',
          metadata: { poll_id: poll.id },
        });
      } catch {
        // Chat mesajı gönderilemedi ama oylama oluşturuldu
      }
      showToast({ message: t('poll.createdSuccess'), type: 'success' });
      router.back();
    } catch {
      showToast({ message: t('errors.generic'), type: 'error' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold">{t('poll.create')}</Text>
      </View>
      <View className="flex-1 px-4">
        <PollCreateForm
          onSubmit={(data) => handleSubmit(data)}
          isLoading={createPoll.isPending}
        />
      </View>
    </SafeAreaView>
  );
}
