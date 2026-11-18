import { supabase } from './supabase';
import type { Notification, NotificationPreferences } from '../types/notification';
import type { Json } from '../types/database.types';

export const notificationsApi = {
  /** Kullanıcının bildirimlerini getir */
  getAll: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as Notification[];
  },

  /** Bildirimi okundu işaretle */
  markAsRead: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  },

  /** Tümünü okundu işaretle */
  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
  },

  /** Push token kaydet */
  savePushToken: async (userId: string, token: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);
    if (error) throw error;
  },

  /** Bildirim tercihlerini güncelle */
  updatePreferences: async (userId: string, prefs: NotificationPreferences): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: prefs as unknown as Json })
      .eq('id', userId);
    if (error) throw error;
  },

  /** Bildirim sil */
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
  },
};
