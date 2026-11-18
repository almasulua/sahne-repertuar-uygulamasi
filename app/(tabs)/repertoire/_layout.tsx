import React from 'react';
import { Stack } from 'expo-router';

export default function RepertoireLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="[songId]" />
      <Stack.Screen name="edit/[songId]" />
    </Stack>
  );
}
