import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { useUpdateNotificationPreferences } from '../../../src/hooks/useNotifications';
import type { NotificationPreferences } from '../../../src/types/notification';

const DEFAULT_PREFS: NotificationPreferences = {
  chat_messages: true,
  poll_created: true,
  event_created: true,
  event_reminder: true,
  setlist_updated: true,
};

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const updatePrefs = useUpdateNotificationPreferences();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  const toggle = (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    if (user) {
      updatePrefs.mutate({ userId: user.id, prefs: updated });
    }
  };

  const items: { key: keyof NotificationPreferences; label: string }[] = [
    { key: 'chat_messages', label: t('notifications.chatMessages') },
    { key: 'poll_created', label: t('notifications.pollCreated') },
    { key: 'event_created', label: t('notifications.eventCreated') },
    { key: 'event_reminder', label: t('notifications.eventReminder') },
    { key: 'setlist_updated', label: t('notifications.setlistUpdated') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold">
          {t('notifications.settings')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {items.map((item) => (
          <View
            key={item.key}
            className="flex-row items-center justify-between bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3.5 mb-2 border border-light-border dark:border-border"
          >
            <Text className="text-light-text-primary dark:text-text-primary text-sm flex-1">{item.label}</Text>
            <Switch value={prefs[item.key]} onValueChange={() => toggle(item.key)} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
