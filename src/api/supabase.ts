import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Database } from '../types/database.types';

const supabaseUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  '';

const supabaseAnonKey =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

if (__DEV__) {
  console.log('[Supabase] URL:', supabaseUrl ? supabaseUrl.slice(0, 30) + '...' : '(BOŞ)');
  console.log('[Supabase] Key:', supabaseAnonKey ? supabaseAnonKey.slice(0, 15) + '...' : '(BOŞ)');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL veya EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlanmamış.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // OAuth (Google/Apple) dönüşü ?code=... ile gelir; verifier AsyncStorage'da tutulur
    flowType: 'pkce',
  },
});

export type SupabaseClient = typeof supabase;
