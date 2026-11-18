import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';
import { supabase } from '../api/supabase';
import { setSentryUser } from '../lib/sentry';
import { identifyUser, resetAnalytics, track } from '../lib/analytics';

/**
 * Auth state'i dinler ve store'u günceller.
 * Root _layout.tsx içinde bir kez çağrılmalı.
 */
export function useAuthListener() {
  const { setSession, setUser, setLoading, reset } = useAuthStore();

  useEffect(() => {
    // İlk oturumu yükle
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setSentryUser({ id: session.user.id });
        identifyUser(session.user.id, { email: session.user.email });
        track('app_open', { authed: true });
        authApi.getProfile(session.user.id).then((profile) => {
          setUser(profile);
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setSentryUser(null);
        track('app_open', { authed: false });
        setLoading(false);
      }
    }).catch(() => {
      // Supabase bağlantı hatası — loading'de takılmayı önle
      setLoading(false);
    });

    // Sonraki değişiklikleri dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          setSentryUser({ id: session.user.id });
          identifyUser(session.user.id, { email: session.user.email });
          if (event === 'SIGNED_IN') track('login');
          const profile = await authApi.getProfile(session.user.id);
          setUser(profile);
        } else {
          setSentryUser(null);
          if (event === 'SIGNED_OUT') track('logout');
          resetAnalytics();
          reset();
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Mevcut kullanıcı ve oturumu döndürür */
export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return { session, user, isLoading, isAuthenticated };
}
