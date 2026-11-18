import React from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSetlists } from '../../../../../src/hooks/useSetlists';
import { SetlistCard } from '../../../../../src/components/setlist/SetlistCard';
import { LoadingSpinner } from '../../../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../../../src/components/ui/EmptyState';

export default function SetlistListScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: setlists, isLoading, refetch, isRefetching } = useSetlists(groupId ?? null);

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('setlist.title')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/groups/${groupId}/setlists/create`)}
          className="bg-primary px-3 py-1.5 rounded-lg"
        >
          <Text className="text-white text-sm font-medium">+ {t('common.add')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !setlists?.length ? (
        <EmptyState
          title={t('setlist.noSetlists')}
          subtitle={t('setlist.createFirst')}
        />
      ) : (
        <FlatList
          data={setlists}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pt-2"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />
          }
          renderItem={({ item }) => (
            <SetlistCard
              setlist={item}
              onPress={() => router.push(`/(tabs)/groups/${groupId}/setlists/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
