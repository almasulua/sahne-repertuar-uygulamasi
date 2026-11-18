import Constants from 'expo-constants';

/**
 * Sentry init wrapper.
 *
 * - DSN sadece `EXPO_PUBLIC_SENTRY_DSN` env'inden okunur — yoksa Sentry başlatılmaz.
 * - Expo Go'da `@sentry/react-native` native binding yüklenemediği için
 *   modül `require` çağrısı `Constants.appOwnership === 'expo'` kontrolünden sonra yapılır.
 * - `wrap()` opsiyonel olarak root component'i sarar; init başarısızsa sessizce noop döner.
 */

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

interface SentryLike {
  init: (options: Record<string, unknown>) => void;
  wrap: <T>(component: T) => T;
  captureException: (err: unknown, ctx?: Record<string, unknown>) => void;
  setUser: (user: { id?: string; email?: string } | null) => void;
}

let Sentry: SentryLike | null = null;
let initialized = false;

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (DSN && !isExpoGo()) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Sentry = require('@sentry/react-native') as SentryLike;
  } catch {
    // Sentry yüklenemedi (paket eksik veya Expo Go) — sessizce devre dışı
    Sentry = null;
  }
}

/** Uygulama başlangıcında bir kez çağrılır. DSN yoksa noop. */
export function initSentry(): void {
  if (initialized || !Sentry || !DSN) return;
  initialized = true;
  try {
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0.1,
      enableAutoSessionTracking: true,
      debug: __DEV__,
    });
  } catch (e) {
    if (__DEV__) console.warn('[sentry] init failed', e);
  }
}

/** Root component'i Sentry ile sarar; aktif değilse component'i olduğu gibi döner. */
export function wrapWithSentry<T>(component: T): T {
  if (!Sentry || !initialized) return component;
  try {
    return Sentry.wrap(component);
  } catch {
    return component;
  }
}

/** Manuel exception kaydı; aktif değilse console.warn'a düşer. */
export function captureException(err: unknown, ctx?: Record<string, unknown>): void {
  if (Sentry && initialized) {
    try {
      Sentry.captureException(err, ctx);
      return;
    } catch {
      // ignore
    }
  }
  if (__DEV__) console.warn('[captureException]', err, ctx);
}

/**
 * Kullanıcı kimliğini Sentry scope'a yazar.
 * Güvenlik/PII: yalnızca `id` gönderilir — e-posta gibi PII Sentry'e iletilmez (KVKK).
 */
export function setSentryUser(user: { id: string } | null): void {
  if (!Sentry || !initialized) return;
  try {
    Sentry.setUser(user);
  } catch {
    // ignore
  }
}

export const sentryEnabled = (): boolean => initialized;
