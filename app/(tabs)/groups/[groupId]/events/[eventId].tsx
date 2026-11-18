import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvent, useUpdateRsvp, useDeleteEvent } from '../../../../../src/hooks/useEvents';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { RsvpButton } from '../../../../../src/components/event/RsvpButton';
import { Badge } from '../../../../../src/components/ui/Badge';
import { Avatar } from '../../../../../src/components/ui/Avatar';
import { LoadingSpinner } from '../../../../../src/components/ui/LoadingSpinner';

export default function EventDetailScreen() {
  const { groupId, eventId } = useLocalSearchParams<{ groupId: string; eventId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { data: event, isLoading } = useEvent(eventId ?? null);
  const updateRsvp = useUpdateRsvp();
  const deleteEvent = useDeleteEvent();

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-light-background dark:bg-background items-center justify-center">
        <Text className="text-light-text-muted dark:text-text-muted">{t('errors.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary">{t('common.back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const myRsvp = event.rsvps.find((r) => r.user_id === user?.id);
  const isCreator = event.created_by === user?.id;

  const handleDelete = () => {
    Alert.alert(t('event.delete'), t('event.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteEvent.mutateAsync({ id: event.id, groupId: groupId! });
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold flex-1" numberOfLines={1}>
          {event.title}
        </Text>
        {isCreator && (
          <TouchableOpacity onPress={handleDelete} className="p-1">
            <Text className="text-error text-sm">{t('common.delete')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Meta */}
        <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl p-4 mt-2 mb-4 border border-light-border dark:border-border">
          <Text className="text-primary text-base font-semibold mb-2">
            📅 {new Date(event.event_date).toLocaleDateString('tr-TR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          {event.venue && (
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm mb-1">📍 {event.venue}</Text>
          )}
          {event.venue_address && (
            <Text className="text-light-text-muted dark:text-text-muted text-xs mb-1">{event.venue_address}</Text>
          )}
          {event.description && (
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm mt-2">{event.description}</Text>
          )}
          <View className="flex-row gap-2 mt-2">
            <Badge label={t(`event.${event.status}`)} variant="primary" />
          </View>
        </View>

        {/* RSVP */}
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">{t('event.yourResponse')}</Text>
        <RsvpButton
          currentStatus={myRsvp?.status}
          onSelect={(status) =>
            updateRsvp.mutate({ eventId: event.id, status, groupId: groupId! })
          }
          disabled={updateRsvp.isPending}
        />

        {/* RSVP Listesi */}
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mt-6 mb-2">{t('event.responses')}</Text>
        <View className="flex-row gap-4 mb-2">
          <Text className="text-green-500 text-sm">✓ {event.rsvp_counts.attending}</Text>
          <Text className="text-yellow-500 text-sm">? {event.rsvp_counts.maybe}</Text>
          <Text className="text-red-400 text-sm">✕ {event.rsvp_counts.not_attending}</Text>
        </View>
        {event.rsvps
          .filter((r) => r.status === 'attending')
          .map((rsvp) => (
            <View key={rsvp.id} className="flex-row items-center py-2">
              <Avatar uri={rsvp.user?.avatar_url} name={rsvp.user?.display_name ?? rsvp.user?.username} size="xs" />
              <Text className="text-light-text-primary dark:text-text-primary text-sm ml-2">
                {rsvp.user?.display_name ?? rsvp.user?.username}
              </Text>
              <Text className="text-green-500 text-xs ml-auto">✓</Text>
            </View>
          ))}

        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}
