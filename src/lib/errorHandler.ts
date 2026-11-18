import { captureException } from './sentry';

/**
 * Global JS hata yakalayıcıları kurar.
 *
 * 1. `ErrorUtils.setGlobalHandler` — RN'in unhandled JS error handler'ı.
 *    Production'da default davranış RedBox göstermek + uygulamayı çökertmek değil
 *    fakat hata sessizce yutulur. Sentry'ye gönderelim.
 *
 * 2. `unhandledrejection` — Promise reject'leri yakalar (await/catch eksiklikleri).
 *    Hermes 0.71+ destekler.
 *
 * `initSentry()` çağrılmadan önce çağrılırsa Sentry init olmayabilir; bu durumda
 * captureException console.warn'a düşer.
 */

interface ErrorUtilsLike {
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
  getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
}

declare const ErrorUtils: ErrorUtilsLike | undefined;

let installed = false;

export function installGlobalErrorHandler(): void {
  if (installed) return;
  installed = true;

  // 1. RN ErrorUtils
  if (typeof ErrorUtils !== 'undefined' && ErrorUtils?.setGlobalHandler) {
    const prev = ErrorUtils.getGlobalHandler?.();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      captureException(error, { fatal: !!isFatal, source: 'ErrorUtils' });
      if (__DEV__) {
        console.error('[GlobalErrorHandler]', { isFatal, error });
      }
      // Önceki handler'ı çağır — RedBox/dev görünümünü koru.
      if (prev) prev(error, isFatal);
    });
  }

  // 2. Unhandled promise rejection (Hermes 0.71+)
  // Global event listener; RN'de window yerine `globalThis` üzerinden.
  type GlobalWithEvents = typeof globalThis & {
    addEventListener?: (event: string, handler: (ev: { reason?: unknown }) => void) => void;
  };
  const g = globalThis as GlobalWithEvents;
  if (typeof g.addEventListener === 'function') {
    try {
      g.addEventListener('unhandledrejection', (ev) => {
        const reason = ev?.reason;
        const error = reason instanceof Error ? reason : new Error(String(reason));
        captureException(error, { source: 'unhandledRejection' });
        if (__DEV__) console.warn('[UnhandledRejection]', reason);
      });
    } catch {
      // Hermes sürümü desteklemiyorsa sessizce atla
    }
  }
}
