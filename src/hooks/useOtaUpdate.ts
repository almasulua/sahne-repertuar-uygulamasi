import { useEffect, useState } from 'react';
import Constants from 'expo-constants';

/**
 * Expo Updates (OTA) entegrasyonu.
 *
 * - DEV build veya Expo Go'da expo-updates native modülü çağrılmaz; sessizce noop.
 * - Production'da `checkAutomatically: ON_LOAD` app.json'da ayarlı → uygulama açılırken
 *   otomatik manifest kontrolü yapılır. Bu hook ayrıca manual fetch + reload sağlar.
 * - `checkForUpdate()` ardından `applyUpdate()` çağrılırsa app yeniden yüklenir.
 *
 * Kullanım:
 *   const { status, checkForUpdate, applyUpdate } = useOtaUpdate();
 *   // Otomatik: hook root layout'ta çağrıldığında app launch'unda check eder.
 */

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

type UpdatesModule = typeof import('expo-updates');
let Updates: UpdatesModule | null = null;

if (!isExpoGo()) {
  try {
    Updates = require('expo-updates') as UpdatesModule;
  } catch {
    Updates = null;
  }
}

export type OtaStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready-to-apply'
  | 'up-to-date'
  | 'disabled'
  | 'error';

interface UseOtaUpdateOptions {
  /** App mount'unda otomatik check ve apply. Default: true. */
  autoApply?: boolean;
}

export function useOtaUpdate({ autoApply = true }: UseOtaUpdateOptions = {}) {
  const [status, setStatus] = useState<OtaStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const isEnabled = !!Updates && Updates.isEnabled !== false && !isExpoGo() && !__DEV__;

  const checkForUpdate = async (): Promise<boolean> => {
    if (!isEnabled || !Updates) {
      setStatus('disabled');
      return false;
    }
    try {
      setStatus('checking');
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setStatus('up-to-date');
        return false;
      }
      setStatus('downloading');
      await Updates.fetchUpdateAsync();
      setStatus('ready-to-apply');
      return true;
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
      return false;
    }
  };

  const applyUpdate = async (): Promise<void> => {
    if (!isEnabled || !Updates) return;
    try {
      await Updates.reloadAsync();
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    if (!autoApply || !isEnabled) {
      if (!isEnabled) setStatus('disabled');
      return;
    }
    let cancelled = false;
    (async () => {
      const ready = await checkForUpdate();
      if (!cancelled && ready) {
        // Kullanıcıyı kesmemek için ufak bir gecikme — splash sonrası uygulanır
        setTimeout(() => {
          if (!cancelled) applyUpdate();
        }, 1500);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApply, isEnabled]);

  return { status, error, isEnabled, checkForUpdate, applyUpdate };
}
