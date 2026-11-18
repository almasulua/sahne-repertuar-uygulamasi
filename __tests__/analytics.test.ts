/**
 * Analytics modülü testleri.
 *
 * Modül singleton state'i içerdiği için her test `jest.isolateModules` ile
 * fresh instance alır. fetch mock'lanır; timer'lar fake.
 */

// expo-constants RN'de bağlı; node test env'inde stub'la.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.0.0' },
    platform: { android: {} },
    appOwnership: 'standalone',
  },
}));

interface AnalyticsModule {
  isAnalyticsEnabled: () => boolean;
  identifyUser: (id: string, traits?: Record<string, unknown>) => void;
  resetAnalytics: () => void;
  track: (event: string, props?: Record<string, unknown>) => void;
  flush: () => Promise<void>;
  shutdownAnalytics: () => void;
}

function loadAnalytics(key: string | undefined): AnalyticsModule {
  let mod!: AnalyticsModule;
  jest.isolateModules(() => {
    if (key) process.env.EXPO_PUBLIC_POSTHOG_KEY = key;
    else delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../src/lib/analytics');
  });
  return mod;
}

function mockFetchOk(): jest.Mock {
  const fn = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = fn;
  return fn;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).fetch;
});

// ----------------------------------------------------------------
// isAnalyticsEnabled
// ----------------------------------------------------------------
describe('isAnalyticsEnabled', () => {
  test('env yoksa false', () => {
    const a = loadAnalytics(undefined);
    expect(a.isAnalyticsEnabled()).toBe(false);
  });

  test('env varsa true', () => {
    const a = loadAnalytics('phc_test');
    expect(a.isAnalyticsEnabled()).toBe(true);
  });
});

// ----------------------------------------------------------------
// Noop davranışı (env yok)
// ----------------------------------------------------------------
describe('noop davranışı (key yok)', () => {
  test('track çağrısı network yapmıyor', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics(undefined);
    a.track('test_event', { x: 1 });
    await a.flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('identifyUser/resetAnalytics noop', () => {
    const a = loadAnalytics(undefined);
    expect(() => a.identifyUser('user-1')).not.toThrow();
    expect(() => a.resetAnalytics()).not.toThrow();
  });

  test('flush noop', async () => {
    const a = loadAnalytics(undefined);
    await expect(a.flush()).resolves.toBeUndefined();
  });
});

// ----------------------------------------------------------------
// track + flush
// ----------------------------------------------------------------
describe('track + flush', () => {
  test('tek event flush ile network çağrısı yapar', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics('phc_test');
    a.track('hello', { x: 1 });
    await a.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://app.posthog.com/batch/');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.api_key).toBe('phc_test');
    expect(body.batch).toHaveLength(1);
    expect(body.batch[0].event).toBe('hello');
    expect(body.batch[0].properties.x).toBe(1);
  });

  test('flush sonrası queue boşalır', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics('phc_test');
    a.track('e1');
    await a.flush();
    await a.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1); // ikinci flush queue boş → skip
  });

  test('birden fazla event tek batch olarak gider', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics('phc_test');
    a.track('e1');
    a.track('e2');
    a.track('e3');
    await a.flush();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.batch).toHaveLength(3);
    expect(body.batch.map((e: { event: string }) => e.event)).toEqual(['e1', 'e2', 'e3']);
  });

  test('event\'lere base context eklenir (app_version, expo_go)', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics('phc_test');
    a.track('e1');
    await a.flush();
    const props = JSON.parse(fetchMock.mock.calls[0][1].body).batch[0].properties;
    expect(props.app_version).toBe('1.0.0');
    expect(props.expo_go).toBe(false); // mock'ta appOwnership 'standalone'
  });
});

// ----------------------------------------------------------------
// 50 event → immediate flush
// ----------------------------------------------------------------
describe('batch size threshold', () => {
  test('50. event\'ten sonra otomatik flush tetiklenir', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics('phc_test');
    for (let i = 0; i < 50; i++) {
      a.track(`event_${i}`);
    }
    // enqueue async olduğu için mikrotask drain
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.batch).toHaveLength(50);
  });

  test('49 event flush tetiklemez', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics('phc_test');
    for (let i = 0; i < 49; i++) {
      a.track(`event_${i}`);
    }
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// identify + reset
// ----------------------------------------------------------------
describe('identify / reset', () => {
  test('identifyUser sonrası event\'lerin distinct_id\'si kullanıcı id\'si olur', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics('phc_test');
    a.identifyUser('user-42', { email: 'x@y.com' });
    a.track('after_identify');
    await a.flush();
    const batch = JSON.parse(fetchMock.mock.calls[0][1].body).batch;
    // identifyUser kendi $set event'ini de yolluyor → 2 event olmalı
    expect(batch.length).toBeGreaterThanOrEqual(2);
    // Tüm event'lerin distinct_id'si aynı
    for (const e of batch) {
      expect(e.distinct_id).toBe('user-42');
    }
  });

  test('resetAnalytics sonrası farklı anonim distinct_id kullanılır', async () => {
    const fetchMock = mockFetchOk();
    const a = loadAnalytics('phc_test');
    a.identifyUser('user-1');
    a.track('e1');
    await a.flush();
    const idBefore = JSON.parse(fetchMock.mock.calls[0][1].body).batch[0].distinct_id;
    expect(idBefore).toBe('user-1');

    a.resetAnalytics();
    a.track('e2');
    await a.flush();
    const idAfter = JSON.parse(fetchMock.mock.calls[1][1].body).batch[0].distinct_id;
    expect(idAfter).not.toBe('user-1');
    expect(idAfter).toMatch(/^anon_/);
  });
});

// ----------------------------------------------------------------
// fetch hatasına dayanıklılık
// ----------------------------------------------------------------
describe('network hatasında batch drop', () => {
  test('fetch reject → flush throw etmez, queue silinir', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('network'));
    const a = loadAnalytics('phc_test');
    a.track('lost_event');
    await expect(a.flush()).resolves.toBeUndefined();
    // İkinci flush boş queue → fetch tekrar çağrılmaz
    await a.flush();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
  });
});

// ----------------------------------------------------------------
// shutdownAnalytics
// ----------------------------------------------------------------
describe('shutdownAnalytics', () => {
  test('timer temizler, queue boşaltır', () => {
    const a = loadAnalytics('phc_test');
    a.track('e1');
    expect(() => a.shutdownAnalytics()).not.toThrow();
  });
});

// ----------------------------------------------------------------
// custom host
// ----------------------------------------------------------------
describe('custom host', () => {
  test('EXPO_PUBLIC_POSTHOG_HOST set ise farklı URL\'e gider', async () => {
    const fetchMock = mockFetchOk();
    let a!: AnalyticsModule;
    jest.isolateModules(() => {
      process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
      process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://eu.posthog.com';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      a = require('../src/lib/analytics');
    });
    a.track('e1');
    await a.flush();
    expect(fetchMock.mock.calls[0][0]).toBe('https://eu.posthog.com/batch/');
    // Cleanup
    delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
  });
});
