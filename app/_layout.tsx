import 'react-native-gesture-handler';
import '../global.css';
import '../src/lib/i18n';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../src/stores/authStore';
import { useOfflineStore } from '../src/stores/offlineStore';
import { useAuthListener } from '../src/hooks/useAuth';
import { useNotificationSetup } from '../src/hooks/useNotifications';
import { useMutedGroupsSync } from '../src/hooks/useMutedGroupsSync';
import { useOtaUpdate } from '../src/hooks/useOtaUpdate';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';
import { ThemeSync } from '../src/components/ThemeSync';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Config } from '../src/constants/config';
import { initSentry } from '../src/lib/sentry';
import { installGlobalErrorHandler } from '../src/lib/errorHandler';

initSentry();
installGlobalErrorHandler();

// ─── QueryClient ────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Config.cache.staleTime,
      gcTime: Config.cache.gcTime,
      retry: 2,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

// ─── NetInfo Listener ────────────────────────────────────────────
function NetInfoListener() {
  const setOnline = useOfflineStore((s) => s.setOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
    return unsubscribe;
  }, []);

  return null;
}

// ─── Root Layout ─────────────────────────────────────────────────
export default function RootLayout() {
  const { isLoading } = useAuthStore();

  useAuthListener();
  useNotificationSetup();
  useMutedGroupsSync();
  useOtaUpdate();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f0f' }}>
        <LoadingSpinner fullscreen />
      </View>
    );
  }

  return (
    <ErrorBoundary>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: Config.cache.gcTime,
      }}
    >
      <NetInfoListener />
      <ThemeSync />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 220,
          contentStyle: { backgroundColor: '#0f0f0f' },
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="invite/[token]" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="song/[songId]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="browser" />
        <Stack.Screen name="chord-library" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="users" />
        <Stack.Screen name="user/[userId]" />
        <Stack.Screen name="matches" />
        <Stack.Screen name="pedal-settings" />
        <Stack.Screen name="public/setlist/[slug]" options={{ animation: 'fade' }} />
      </Stack>
    </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
