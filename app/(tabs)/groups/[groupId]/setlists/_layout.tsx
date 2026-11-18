import React from 'react';
import { Stack } from 'expo-router';

export default function SetlistsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[setlistId]/index" />
      <Stack.Screen name="[setlistId]/add-song" />
      <Stack.Screen name="[setlistId]/stage" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
