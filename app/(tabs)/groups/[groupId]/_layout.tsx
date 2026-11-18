import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function GroupDetailLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="members" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="repertoire" />
      <Stack.Screen name="setlists" />
      <Stack.Screen name="polls" />
      <Stack.Screen name="events" />
    </Stack>
  );
}
