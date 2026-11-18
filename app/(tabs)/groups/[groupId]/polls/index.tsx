import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePolls, useVotePoll, useClosePoll, useDeletePoll } from '../../../../../src/hooks/usePolls';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { PollCard } from '../../../../../src/components/poll/PollCard';
import { LoadingSpinner } from '../../../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../../../src/components/ui/EmptyState';

export default function PollsListScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { data: polls, isLoading, refetch, isRefetching } = usePolls(groupId ?? null);
  const votePoll = useVotePoll();
  const closePoll = useClosePoll();
  const deletePoll = useDeletePoll();

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('poll.title')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/groups/${groupId}/polls/create`)}
          className="bg-primary px-3 py-1.5 rounded-lg"
        >
          <Text className="text-white text-sm font-medium">+ {t('common.add')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !polls?.length ? (
        <EmptyState title={t('poll.noPolls')} subtitle={t('poll.createFirst')} />
      ) : (
        <FlatList
          data={polls}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pt-2"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />
          }
          renderItem={({ item }) => (
            <PollCard
              poll={item}
              currentUserId={user?.id}
              onVote={(optionId) =>
                votePoll.mutate({ pollId: item.id, optionId, groupId: groupId! })
              }
              onClose={
                item.created_by === user?.id && item.status !== 'closed'
                  ? () => closePoll.mutate({ id: item.id, groupId: groupId! })
                  : undefined
              }
              onDelete={
                item.created_by === user?.id
                  ? () => {
                      Alert.alert(t('common.delete'), t('poll.deleteConfirm') ?? t('common.confirm'), [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('common.delete'),
                          style: 'destructive',
                          onPress: () => deletePoll.mutate({ id: item.id, groupId: groupId! }),
                        },
                      ]);
                    }
                  : undefined
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
