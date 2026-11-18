import { router } from 'expo-router';

/**
 * router.back()'in güvenli versiyonu. Stack'te geri gidilecek ekran yoksa
 * (deep link, fresh app start, ilk modal) `fallback` rotasına yönlendirir.
 * Aksi halde "GO_BACK was not handled by any navigator" uyarısı alınır.
 */
export function safeBack(fallback: string = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
