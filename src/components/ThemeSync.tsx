import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { useUIStore } from '../stores/uiStore';

/**
 * uiStore.theme tercihini NativeWind colorScheme'iyle senkronize eder.
 * 'system' → cihaz ayarını takip eder; 'light'/'dark' → manuel.
 */
export function ThemeSync() {
  const theme = useUIStore((s) => s.theme);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  return null;
}
