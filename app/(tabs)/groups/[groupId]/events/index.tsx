import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../../../../../src/hooks/useEvents';
import { CalendarView } from '../../../../../src/components/event/CalendarView';
import { EventCard } from '../../../../../src/components/event/EventCard';
import { LoadingSpinner } from '../../../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../../../src/components/ui/EmptyState';

export default function EventsListScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: events, isLoading, refetch, isRefetching } = useEvents(groupId ?? null);
  const [showCalendar, setShowCalendar] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('event.title')}
        </Text>
        <TouchableOpacity
          onPress={() => setShowCalendar(!showCalendar)}
          className="mr-2 p-1"
        >
          <Text className="text-primary text-sm">{showCalendar ? '📋' : '📅'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/groups/${groupId}/events/create`)}
          className="bg-primary px-3 py-1.5 rounded-lg"
        >
          <Text className="text-white text-sm font-medium">+ {t('common.add')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={events ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pt-2"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />
          }
          ListHeaderComponent={
            showCalendar && events ? (
              <CalendarView
                events={events}
                onDayPress={(date) => {
                  // Scroll to events on that date
                }}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState title={t('event.noEvents')} subtitle={t('event.createFirst')} />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/(tabs)/groups/${groupId}/events/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
