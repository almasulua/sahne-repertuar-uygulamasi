import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Android'de auth sekmesi kapandıktan sonra bekleyen oturumu tamamlar (iOS'ta noop)
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';
import type { User, UserLevel } from '../types/user';

// Güvenlik (017_security_hardening): public.users.email kolonu anon/authenticated
// rollerinden REVOKE edildi — başka kullanıcıların e-postası sızdırılamasın diye.
// Bu yüzden hiçbir SELECT 'email' veya '*' kullanmaz; kendi e-postası auth session'dan gelir.
// Kendi profili için okunabilir kolonlar. Güvenlik (017_security_hardening): email,
// push_token, notification_preferences ve muted_group_ids private kolonları anon/authenticated
// rollerinden REVOKE edildi — bu yüzden hiçbir client SELECT'i onları istemez. Bu alanlar
// yalnızca UPDATE ile yazılır; edge function onları service_role ile okur. Kendi e-postası
// auth session'dan (auth.users) gelir.
const OWN_USER_COLUMNS =
  'id, username, display_name, avatar_url, instruments, genres, level, created_at, updated_at';
// Başkalarına görünür public profil kolonları (şu an OWN ile aynı; ayrım ileride özelleşebilir):
const PUBLIC_USER_COLUMNS =
  'id, username, display_name, avatar_url, instruments, genres, level, created_at, updated_at';

export interface MusicianMatch {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  instruments: string[];
  genres: string[];
  level: UserLevel | null;
  score: number;
  shared_instruments: string[];
  shared_genres: string[];
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

export const authApi = {
  /** Mevcut oturumu döndürür */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /** E-posta + şifre ile giriş */
  login: async ({ email, password }: LoginParams) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /** Yeni kayıt */
  register: async ({ email, password, username, displayName }: RegisterParams) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: displayName,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Google / Apple ile giriş (Supabase OAuth + PKCE).
   * Sistem tarayıcısında sağlayıcı sayfası açılır; dönüşte `muzikapp://auth/callback?code=...`
   * yakalanır ve kod oturuma çevrilir. Kullanıcı vazgeçerse `null` döner (hata değil).
   * Yeni kullanıcının public.users satırı handle_new_user trigger'ı ile oluşur.
   */
  signInWithOAuth: async (provider: OAuthProvider) => {
    // Expo Go'da exp://.../--/auth/callback, dev/prod build'de muzikapp://auth/callback
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('OAuth URL alınamadı');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return null; // iptal / kapatıldı

    const { queryParams } = Linking.parse(result.url);
    const errorDescription = queryParams?.error_description ?? queryParams?.error;
    if (errorDescription) throw new Error(String(errorDescription));
    const code = queryParams?.code;
    if (typeof code !== 'string') throw new Error('OAuth dönüşünde kod yok');

    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return sessionData;
  },

  /** Çıkış */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /** Şifre sıfırlama e-postası gönder */
  sendPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'muzikapp://reset-password',
    });
    if (error) throw error;
  },

  /** Profil bilgilerini çek (auth + public.users) */
  getProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select(OWN_USER_COLUMNS)
      .eq('id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw error;
    }
    return data as User;
  },

  /** Username/display_name'e göre kullanıcı ara (case-insensitive ILIKE) */
  searchUsers: async (query: string, limit: number = 20): Promise<User[]> => {
    const q = query.trim();
    if (!q) return [];
    const pattern = `%${q}%`;
    const { data, error } = await supabase
      .from('users')
      .select(PUBLIC_USER_COLUMNS)
      .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as User[];
  },

  /**
   * Müzisyen eşleştirme: kullanıcı için skorlu öneri listesi döner.
   * Skor 0–100, en az 1 ortak enstrüman zorunlu (RPC find_musician_matches).
   */
  findMusicianMatches: async (
    userId: string,
    limit: number = 20,
  ): Promise<MusicianMatch[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb: any = supabase;
    const { data, error } = await sb.rpc('find_musician_matches', {
      p_user_id: userId,
      p_limit: limit,
    });
    if (error) throw error;
    return (data ?? []) as MusicianMatch[];
  },

  /** Public profil — başkası tarafından görüntülenir */
  getPublicProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select(PUBLIC_USER_COLUMNS)
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as User | null;
  },

  /** Profili güncelle */
  updateProfile: async (userId: string, updates: Partial<User>) => {
    // email public.users üzerinden güncellenmez (auth.users'a aittir) — ayıkla
    const { email: _ignoredEmail, ...safeUpdates } = updates;
    const { data, error } = await supabase
      .from('users')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(OWN_USER_COLUMNS)
      .single();
    if (error) throw error;
    return data as User;
  },

  /** Auth state değişikliklerini dinle */
  onAuthStateChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
