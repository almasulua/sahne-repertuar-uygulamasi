import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCreateEvent } from '../../../../../src/hooks/useEvents';
import { useUIStore } from '../../../../../src/stores/uiStore';

function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreateEventScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const createEvent = useCreateEvent();
  const showToast = useUIStore((s) => s.showToast);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [dateSelected, setDateSelected] = useState(false);

  // Android: ayrı date ve time picker gösterilir
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const canSubmit = title.trim() && dateSelected && !createEvent.isPending;

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selected) {
      setEventDate(selected);
      setDateSelected(true);
      // Android: tarih seçildikten sonra saat seçiciyi aç
      if (Platform.OS === 'android') {
        setShowTimePicker(true);
      }
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selected) {
      setEventDate(selected);
    }
  };

  const handleCreate = async () => {
    if (!canSubmit || !groupId) return;
    try {
      await createEvent.mutateAsync({
        group_id: groupId,
        title: title.trim(),
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        venue_address: venueAddress.trim() || undefined,
        event_date: eventDate.toISOString(),
      });
      showToast({ message: t('event.createdSuccess'), type: 'success' });
      router.back();
    } catch (e) {
      if (__DEV__) console.error('[CreateEvent] error:', e);
      showToast({ message: t('errors.generic'), type: 'error' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold">{t('event.create')}</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mt-4 mb-1">{t('event.eventTitle')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-base mb-3 border border-light-border dark:border-border"
          value={title}
          onChangeText={setTitle}
          placeholder={t('event.titlePlaceholder')}
          placeholderTextColor="#9E9E9E"
        />

        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('event.date')}</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 mb-3 border border-light-border dark:border-border"
        >
          <Text className={dateSelected ? 'text-light-text-primary dark:text-text-primary text-base' : 'text-light-text-muted dark:text-text-muted text-base'}>
            {dateSelected ? formatDateTime(eventDate) : t('event.selectDate')}
          </Text>
        </TouchableOpacity>

        {/* iOS: inline picker her zaman gösterilir; Android: modal */}
        {(showDatePicker || Platform.OS === 'ios') && Platform.OS === 'ios' && (
          <View className="mb-3">
            <DateTimePicker
              value={eventDate}
              mode="datetime"
              display="spinner"
              onChange={(e, d) => {
                if (d) {
                  setEventDate(d);
                  setDateSelected(true);
                }
              }}
              minimumDate={new Date()}
            />
          </View>
        )}

        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={eventDate}
            mode="time"
            display="default"
            is24Hour
            onChange={handleTimeChange}
          />
        )}

        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('event.venue')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-base mb-3 border border-light-border dark:border-border"
          value={venue}
          onChangeText={setVenue}
          placeholder={t('event.venuePlaceholder')}
          placeholderTextColor="#9E9E9E"
        />

        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('event.venueAddress')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-base mb-3 border border-light-border dark:border-border"
          value={venueAddress}
          onChangeText={setVenueAddress}
          placeholder={t('event.addressPlaceholder')}
          placeholderTextColor="#9E9E9E"
        />

        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('event.description')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-base mb-6 border border-light-border dark:border-border"
          value={description}
          onChangeText={setDescription}
          placeholder={t('event.descriptionPlaceholder')}
          placeholderTextColor="#9E9E9E"
          multiline
        />

        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canSubmit}
          className={`py-3.5 rounded-xl items-center mb-8 ${canSubmit ? 'bg-primary' : 'bg-light-surface-3 dark:bg-surface-3'}`}
        >
          <Text className={`font-semibold ${canSubmit ? 'text-white' : 'text-light-text-muted dark:text-text-muted'}`}>
            {t('event.create')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
