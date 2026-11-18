import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PollWithVotes, PollOption } from '../../types/poll';

interface PollCardProps {
  poll: PollWithVotes;
  currentUserId?: string;
  onVote: (optionId: string) => void;
  onClose?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

function OptionBar({
  option,
  count,
  total,
  isSelected,
  isClosed,
  onPress,
}: {
  option: PollOption;
  count: number;
  total: number;
  isSelected: boolean;
  isClosed: boolean;
  onPress: () => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const showResults = isClosed || isSelected;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isClosed}
      className={`rounded-xl mb-2 overflow-hidden border ${
        isSelected ? 'border-primary' : 'border-light-border dark:border-border'
      }`}
      activeOpacity={0.7}
    >
      <View className="relative px-3 py-2.5">
        {showResults && (
          <View
            className="absolute left-0 top-0 bottom-0 bg-primary/15 rounded-xl"
            style={{ width: `${pct}%` }}
          />
        )}
        <View className="flex-row items-center justify-between relative">
          <View className="flex-row items-center flex-1">
            {isSelected && <Text className="text-primary mr-1.5">●</Text>}
            <Text className="text-light-text-primary dark:text-text-primary text-sm">{option.text}</Text>
          </View>
          {showResults && (
            <Text className="text-light-text-muted dark:text-text-muted text-xs ml-2">
              {count} ({pct}%)
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function PollCard({ poll, currentUserId, onVote, onClose, onDelete, compact }: PollCardProps) {
  const { t } = useTranslation();
  const isClosed = poll.status === 'closed';
  const myVoteOptionId = poll.votes.find((v) => v.user_id === currentUserId)?.option_id;

  return (
    <View className={`bg-light-surface-2 dark:bg-surface-2 rounded-2xl p-4 ${compact ? '' : 'mb-3 border border-light-border dark:border-border'}`}>
      <View className="flex-row items-start justify-between mb-3">
        <Text className="text-light-text-primary dark:text-text-primary font-semibold text-base flex-1">
          📊 {poll.question}
        </Text>
        {isClosed && (
          <Text className="text-light-text-muted dark:text-text-muted text-xs ml-2">{t('poll.closed')}</Text>
        )}
      </View>

      {poll.options.map((option) => (
        <OptionBar
          key={option.id}
          option={option}
          count={poll.vote_counts[option.id] ?? 0}
          total={poll.total_votes}
          isSelected={myVoteOptionId === option.id}
          isClosed={isClosed}
          onPress={() => onVote(option.id)}
        />
      ))}

      <Text className="text-light-text-muted dark:text-text-muted text-xs mt-1">
        {poll.total_votes} {t('poll.votes')}
        {poll.is_anonymous ? ` · ${t('poll.anonymous')}` : ''}
      </Text>

      <View className="flex-row items-center gap-4 mt-2">
        {onClose && !isClosed && (
          <TouchableOpacity onPress={onClose}>
            <Text className="text-error text-xs">{t('poll.closePoll')}</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete}>
            <Text className="text-error text-xs">{t('common.delete')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
