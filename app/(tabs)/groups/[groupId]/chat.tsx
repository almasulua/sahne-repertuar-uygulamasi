import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMessages, useSendMessage, useDeleteMessage } from '../../../../src/hooks/useMessages';
import { useAuth } from '../../../../src/hooks/useAuth';
import { MessageBubble } from '../../../../src/components/chat/MessageBubble';
import { ChatInput } from '../../../../src/components/chat/ChatInput';
import { LoadingSpinner } from '../../../../src/components/ui/LoadingSpinner';
import type { Message } from '../../../../src/types/message';

function formatDateLabel(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return t('chat.today');
  if (date.toDateString() === yesterday.toDateString()) return t('chat.yesterday');
  return date.toLocaleDateString('tr-TR');
}

export default function ChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(groupId ?? null);
  const sendMessage = useSendMessage(groupId ?? '');
  const deleteMessage = useDeleteMessage(groupId ?? '');

  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Tüm mesajları düz listeye dönüştür
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flat();
  }, [data]);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage.mutate({
        content,
        reply_to_id: replyTo?.id,
      });
      setReplyTo(null);
    },
    [replyTo, sendMessage]
  );

  const handleLongPress = (msg: Message) => {
    if (msg.sender_id !== user?.id) return;
    Alert.alert(t('chat.deleteMessage'), t('chat.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteMessage.mutate(msg.id),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-light-surface dark:bg-surface border-b border-light-border dark:border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-primary text-xl">←</Text>
          </TouchableOpacity>
          <Text className="text-light-text-primary dark:text-text-primary font-semibold text-base flex-1">
            {t('chat.title')}
          </Text>
        </View>

        {/* Mesajlar (ters sıra) */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            inverted
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwn={item.sender_id === user?.id}
                onLongPress={() => handleLongPress(item)}
                onReplyPress={() => setReplyTo(item)}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-16">
                <Text className="text-3xl mb-2">💬</Text>
                <Text className="text-light-text-secondary dark:text-text-secondary text-sm text-center">
                  {t('chat.noMessages')}
                </Text>
                <Text className="text-light-text-muted dark:text-text-muted text-xs text-center mt-1">
                  {t('chat.beFirst')}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Mesaj Girişi */}
        <ChatInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          disabled={sendMessage.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
