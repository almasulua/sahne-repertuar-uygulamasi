import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateSetlist } from '../../../../../src/hooks/useSetlists';
import { useUIStore } from '../../../../../src/stores/uiStore';

export default function CreateSetlistScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const createSetlist = useCreateSetlist();
  const showToast = useUIStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');

  const canSubmit = name.trim() && !createSetlist.isPending;

  const handleCreate = async () => {
    if (!canSubmit || !groupId) return;
    try {
      const setlist = await createSetlist.mutateAsync({
        group_id: groupId,
        name: name.trim(),
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
      });
      showToast({ message: t('setlist.createdSuccess'), type: 'success' });
      router.replace(`/(tabs)/groups/${groupId}/setlists/${setlist.id}`);
    } catch {
      showToast({ message: t('errors.generic'), type: 'error' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold">{t('setlist.create')}</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mt-4 mb-1">{t('setlist.name')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-base mb-3 border border-light-border dark:border-border"
          value={name}
          onChangeText={setName}
          placeholder={t('setlist.namePlaceholder')}
          placeholderTextColor="#9E9E9E"
        />

        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('setlist.description')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-base mb-3 border border-light-border dark:border-border"
          value={description}
          onChangeText={setDescription}
          placeholder={t('setlist.descriptionPlaceholder')}
          placeholderTextColor="#9E9E9E"
          multiline
        />

        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('setlist.venue')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-base mb-6 border border-light-border dark:border-border"
          value={venue}
          onChangeText={setVenue}
          placeholder={t('setlist.venuePlaceholder')}
          placeholderTextColor="#9E9E9E"
        />

        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canSubmit}
          className={`py-3.5 rounded-xl items-center mb-8 ${canSubmit ? 'bg-primary' : 'bg-light-surface-3 dark:bg-surface-3'}`}
        >
          <Text className={`font-semibold ${canSubmit ? 'text-white' : 'text-light-text-muted dark:text-text-muted'}`}>
            {t('setlist.create')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
