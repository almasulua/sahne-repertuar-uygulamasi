import { useEffect, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useAuth } from './useAuth';
import { supabase } from '../api/supabase';

/**
 * MMKV'deki muted_group_ids listesini server'a sync eder.
 * Edge function `users.muted_group_ids`'i okuyup push'u suskunluyor.
 *
 * - App start'ta authed olunca bir kere çalışır.
 * - Sonrası: subscribe ile her toggleMutedGroup değişikliğinde tetiklenir.
 * - Hata sessizce loglanır — offline iken hata kullanıcıyı rahatsız etmesin.
 */
export function useMutedGroupsSync() {
  const { user } = useAuth();
  const userId = user?.id;
  const lastPushedRef = useRef<string>('');

  useEffect(() => {
    if (!userId) return;

    const pushIfChanged = (ids: string[]) => {
      const serialized = ids.slice().sort().join(',');
      if (serialized === lastPushedRef.current) return;
      lastPushedRef.current = serialized;

      // muted_group_ids artık database.types.ts'te tanımlı — cast'e gerek yok.
      supabase
        .from('users')
        .update({ muted_group_ids: ids })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            console.warn('[muted-groups-sync] başarısız:', error.message);
          }
        });
    };

    // İlk sync
    pushIfChanged(useUIStore.getState().mutedGroupIds);

    // Değişiklikleri dinle
    const unsub = useUIStore.subscribe((state, prev) => {
      if (state.mutedGroupIds !== prev.mutedGroupIds) {
        pushIfChanged(state.mutedGroupIds);
      }
    });

    return () => unsub();
  }, [userId]);
}
