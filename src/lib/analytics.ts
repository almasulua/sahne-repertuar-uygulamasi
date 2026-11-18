/**
 * Hafif analytics katmanı — PostHog Capture API üzerinden çalışan thin HTTP wrapper.
 *
 * Tasarım kararları:
 *   - Yeni native modül eklemez (Expo Go uyumlu).
 *   - `EXPO_PUBLIC_POSTHOG_KEY` env'i yoksa tüm fonksiyonlar noop.
 *   - Olaylar in-memory queue'da biriktirilir, periyodik (10sn) flush; ayrıca queue
 *     50'ye ulaşınca immediate flush.
 *   - Network hatasında olaylar **drop edilir** (offline ölçümünden ziyade
 *     production telemetri için tasarlandı; kritik veri burada değil).
 *   - distinct_id ya kullanıcı UUID'si (identify ile set) ya da rastgele anonim slug.
 *
 * Capture API referansı:
 *   POST https://app.posthog.com/capture/
 *   Body: { api_key, event, distinct_id, properties, timestamp }
 */

import Constants from 'expo-constants';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';
const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_BATCH_SIZE = 50;

interface CaptureEvent {
  event: string;
  distinct_id: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

let distinctId: string = `anon_${Math.random().toString(36).slice(2, 10)}`;
let queue: CaptureEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

const baseContext = {
  app_version: (Constants as { expoConfig?: { version?: string } }).expoConfig?.version,
  platform_os: (Constants as { platform?: { ios?: unknown; android?: unknown } }).platform,
  expo_go: Constants.appOwnership === 'expo',
};

export function isAnalyticsEnabled(): boolean {
  return !!POSTHOG_KEY;
}

/** Identify çağrısı — login/onAuthStateChange sırasında çağrılır. */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (!POSTHOG_KEY) return;
  distinctId = userId;
  if (traits) {
    void enqueue('$set', { $set: traits });
  }
}

/** Logout / oturum sıfırlama. Sonraki olaylar anonim slug ile gider. */
export function resetAnalytics(): void {
  distinctId = `anon_${Math.random().toString(36).slice(2, 10)}`;
}

/** Olay yakala. PostHog convention: snake_case event name + properties. */
export function track(event: string, properties: Record<string, unknown> = {}): void {
  if (!POSTHOG_KEY) return;
  void enqueue(event, properties);
}

async function enqueue(event: string, properties: Record<string, unknown>): Promise<void> {
  queue.push({
    event,
    distinct_id: distinctId,
    properties: { ...baseContext, ...properties },
    timestamp: new Date().toISOString(),
  });
  ensureFlushTimer();
  if (queue.length >= FLUSH_BATCH_SIZE) {
    await flush();
  }
}

function ensureFlushTimer(): void {
  if (initialized || !POSTHOG_KEY) return;
  initialized = true;
  flushTimer = setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);
}

export async function flush(): Promise<void> {
  if (!POSTHOG_KEY || queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    await fetch(`${POSTHOG_HOST}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        batch: batch.map((e) => ({ ...e, properties: { ...e.properties } })),
      }),
    });
  } catch {
    // Network hatası → batch drop edilir (telemetri'de güvenlik veya kritik veri yok).
  }
}

/** Test/teardown için. */
export function shutdownAnalytics(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  initialized = false;
  queue = [];
}
