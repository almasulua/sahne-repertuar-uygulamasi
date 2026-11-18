import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from '../ui/Avatar';
import type { Message } from '../../types/message';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onLongPress?: () => void;
  onReplyPress?: () => void;
  onPollPress?: (pollId: string) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function ReplyPreview({ reply }: { reply: Message }) {
  return (
    <View className="border-l-2 border-primary pl-2 mb-1 bg-light-surface-2 dark:bg-surface-2 rounded-r-lg p-1.5">
      <Text className="text-primary text-xs font-semibold">
        {reply.sender?.display_name ?? reply.sender?.username ?? 'Bilinmeyen'}
      </Text>
      <Text className="text-light-text-secondary dark:text-text-secondary text-xs" numberOfLines={1}>
        {reply.content}
      </Text>
    </View>
  );
}

export function MessageBubble({ message, isOwn, onLongPress, onReplyPress, onPollPress }: MessageBubbleProps) {
  const sender = message.sender;
  const isSongCard = message.type === 'song_card';
  const isPoll = message.type === 'poll';

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      className={`flex-row mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
      activeOpacity={0.8}
    >
      {!isOwn && (
        <Avatar
          uri={sender?.avatar_url}
          name={sender?.display_name ?? sender?.username}
          size="xs"
        />
      )}
      <View
        className={[
          'max-w-[75%] rounded-2xl px-3 py-2 ml-2',
          isOwn
            ? 'bg-primary rounded-tr-sm'
            : 'bg-light-surface-2 dark:bg-surface-2 rounded-tl-sm',
        ].join(' ')}
      >
        {!isOwn && (
          <Text className="text-primary text-xs font-semibold mb-0.5">
            {sender?.display_name ?? sender?.username ?? 'Bilinmeyen'}
          </Text>
        )}
        {message.reply_to && <ReplyPreview reply={message.reply_to} />}

        {isPoll ? (
          <TouchableOpacity
            onPress={() => onPollPress?.((message.metadata as { poll_id?: string })?.poll_id ?? '')}
            className="bg-light-surface-3 dark:bg-surface-3 rounded-xl p-2"
          >
            <Text className="text-light-text-muted dark:text-text-muted text-xs mb-0.5">📊 Oylama</Text>
            <Text className="text-light-text-primary dark:text-text-primary font-semibold text-sm">{message.content}</Text>
          </TouchableOpacity>
        ) : isSongCard ? (
          <View className="bg-light-surface-3 dark:bg-surface-3 rounded-xl p-2">
            <Text className="text-light-text-muted dark:text-text-muted text-xs mb-0.5">🎵 Şarkı paylaşıldı</Text>
            <Text className="text-light-text-primary dark:text-text-primary font-semibold text-sm">
              {(message.metadata as { title?: string })?.title ?? message.content}
            </Text>
          </View>
        ) : (
          <Text className={`text-sm ${isOwn ? 'text-white' : 'text-light-text-primary dark:text-text-primary'}`}>
            {message.content}
          </Text>
        )}

        <View className="flex-row items-center justify-end mt-0.5 gap-2">
          {onReplyPress && (
            <TouchableOpacity onPress={onReplyPress}>
              <Text className="text-xs text-light-text-muted dark:text-text-muted">↩</Text>
            </TouchableOpacity>
          )}
          <Text className={`text-xs ${isOwn ? 'text-white/70' : 'text-light-text-muted dark:text-text-muted'}`}>
            {formatTime(message.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
