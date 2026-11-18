import React from 'react';
import { Stack } from 'expo-router';

export default function GroupRepertoireLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="from-personal" />
    </Stack>
  );
}
