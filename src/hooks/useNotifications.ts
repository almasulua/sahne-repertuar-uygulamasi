import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { useAuth } from './useAuth';
import type { NotificationPreferences } from '../types/notification';

// Expo Go'da push notifications desteklenmiyor (SDK 53+).
// require'ı Expo Go kontrolünden sonra yap — aksi halde native init crash'i.
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

if (!isExpoGo()) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch {
    // Modül yüklenemedi, sessizce atla
  }
}

export const NOTIFICATION_KEYS = {
  all: (userId: string) => ['notifications', userId] as const,
};

// Bildirim handler'ı sadece development build'de ayarla
function setupNotificationHandler() {
  if (!Notifications || isExpoGo()) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Sessizce atla
  }
}

setupNotificationHandler();

/** Push notification kayıt */
async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device || isExpoGo()) return null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (err) {
    console.warn('Push notification registration failed:', err);
    return null;
  }
}

/** Ana bildirim hook'u — app layout'ta çağrılır */
export function useNotificationSetup() {
  const { user, session } = useAuth();

  useEffect(() => {
    if (!session || !user) return;
    if (!Notifications || isExpoGo()) return;

    registerForPushNotifications().then((token) => {
      if (token) {
        notificationsApi.savePushToken(user.id, token).catch(console.error);
      }
    });

    // Bildirime tıklanma handler'ı
    let subscription: { remove: () => void } | undefined;
    try {
      subscription = Notifications!.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);
      });
    } catch {
      // Sessizce atla
    }

    return () => subscription?.remove();
  }, [session, user]);
}

/** Kullanıcının bildirimleri */
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: NOTIFICATION_KEYS.all(user?.id ?? ''),
    queryFn: () => notificationsApi.getAll(user!.id),
    enabled: !!user,
  });
}

/** Bildirimi okundu işaretle */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all(user?.id ?? '') });
    },
  });
}

/** Tümünü okundu işaretle */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all(user?.id ?? '') });
    },
  });
}

/** Bildirim tercihlerini güncelle */
export function useUpdateNotificationPreferences() {
  return useMutation({
    mutationFn: ({ userId, prefs }: { userId: string; prefs: NotificationPreferences }) =>
      notificationsApi.updatePreferences(userId, prefs),
  });
}
