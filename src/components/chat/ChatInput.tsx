import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Message } from '../../types/message';

interface ChatInputProps {
  onSend: (content: string) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  onCreatePoll?: () => void;
}

export function ChatInput({ onSend, replyTo, onCancelReply, disabled, onCreatePoll }: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View className="bg-light-surface dark:bg-surface border-t border-light-border dark:border-border px-3 pb-4 pt-2">
      {replyTo && (
        <View className="flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl px-3 py-2 mb-2">
          <View className="flex-1">
            <Text className="text-primary text-xs font-semibold">
              {t('chat.replyingTo')} {replyTo.sender?.display_name ?? replyTo.sender?.username}
            </Text>
            <Text className="text-light-text-secondary dark:text-text-secondary text-xs" numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} className="ml-2 p-1">
            <Text className="text-light-text-muted dark:text-text-muted text-lg">✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <View className="flex-row items-end gap-2">
        {onCreatePoll && (
          <TouchableOpacity onPress={onCreatePoll} className="w-10 h-10 items-center justify-center">
            <Text className="text-light-text-secondary dark:text-text-secondary text-lg">📊</Text>
          </TouchableOpacity>
        )}
        <TextInput
          className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-2xl px-4 py-2.5 text-light-text-primary dark:text-text-primary text-base max-h-24"
          placeholder={t('chat.placeholder')}
          placeholderTextColor="#9E9E9E"
          value={text}
          onChangeText={setText}
          multiline
          editable={!disabled}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            text.trim() && !disabled ? 'bg-primary' : 'bg-light-surface-3 dark:bg-surface-3'
          }`}
        >
          <Text className="text-white text-base">↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
