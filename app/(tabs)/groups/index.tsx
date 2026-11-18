import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyGroups } from '../../../src/hooks/useGroups';
import { GroupCard } from '../../../src/components/group/GroupCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonList, GroupCardSkeleton } from '../../../src/components/ui/Skeleton';
import { ToastContainer } from '../../../src/components/ui/Toast';
import { listPerfProps } from '../../../src/lib/listPerf';

export default function GroupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: groups, isLoading, refetch, isRefetching } = useMyGroups();

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold flex-1">
          {t('groups.title')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/groups/create')}
          className="bg-primary w-9 h-9 rounded-full items-center justify-center"
        >
          <Text className="text-white text-xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="px-4">
          <SkeletonList count={4} Item={GroupCardSkeleton} />
        </View>
      ) : (
        <FlatList
          {...listPerfProps}
          data={groups ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => router.push(`/(tabs)/groups/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />
          }
          ListEmptyComponent={
            <EmptyState
              title={t('groups.noGroups')}
              subtitle={t('groups.createFirst')}
              actionLabel={t('groups.createGroup')}
              onAction={() => router.push('/(tabs)/groups/create')}
              icon="👥"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      <ToastContainer />
    </SafeAreaView>
  );
}
