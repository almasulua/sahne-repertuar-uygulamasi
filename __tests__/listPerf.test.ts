/**
 * listPerf testleri.
 *
 * Platform-dependent prop'lar (removeClippedSubviews) için react-native'i mock'la.
 */

interface ListPerfModule {
  listPerfProps: {
    removeClippedSubviews: boolean;
    windowSize: number;
    initialNumToRender: number;
    maxToRenderPerBatch: number;
    updateCellsBatchingPeriod: number;
  };
  fixedItemLayout: (height: number) => (
    data: ArrayLike<unknown> | null | undefined,
    index: number,
  ) => { length: number; offset: number; index: number };
}

function loadModule(os: 'android' | 'ios' | 'web' | 'macos' | 'windows'): ListPerfModule {
  let mod!: ListPerfModule;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: os } }), { virtual: true });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../src/lib/listPerf');
  });
  return mod;
}

// ----------------------------------------------------------------
// listPerfProps
// ----------------------------------------------------------------
describe('listPerfProps', () => {
  test('android: removeClippedSubviews=true (bellek kazancı)', () => {
    const m = loadModule('android');
    expect(m.listPerfProps.removeClippedSubviews).toBe(true);
  });

  test('ios: removeClippedSubviews=false (iOS\'ta sorun çıkarabilir)', () => {
    const m = loadModule('ios');
    expect(m.listPerfProps.removeClippedSubviews).toBe(false);
  });

  test('web: removeClippedSubviews=false', () => {
    const m = loadModule('web');
    expect(m.listPerfProps.removeClippedSubviews).toBe(false);
  });

  test('windowSize=11 (varsayılan 21\'den düşük, memory + perf trade-off)', () => {
    const m = loadModule('android');
    expect(m.listPerfProps.windowSize).toBe(11);
  });

  test('initialNumToRender=10 (ilk paint için)', () => {
    const m = loadModule('android');
    expect(m.listPerfProps.initialNumToRender).toBe(10);
  });

  test('maxToRenderPerBatch=10', () => {
    const m = loadModule('android');
    expect(m.listPerfProps.maxToRenderPerBatch).toBe(10);
  });

  test('updateCellsBatchingPeriod=50ms (UI thread serbest)', () => {
    const m = loadModule('android');
    expect(m.listPerfProps.updateCellsBatchingPeriod).toBe(50);
  });
});

// ----------------------------------------------------------------
// fixedItemLayout — getItemLayout factory
// ----------------------------------------------------------------
describe('fixedItemLayout', () => {
  test('index 0: offset 0', () => {
    const m = loadModule('android');
    const getLayout = m.fixedItemLayout(80);
    expect(getLayout(null, 0)).toEqual({ length: 80, offset: 0, index: 0 });
  });

  test('index 5: offset = height * 5', () => {
    const m = loadModule('android');
    const getLayout = m.fixedItemLayout(80);
    expect(getLayout(null, 5)).toEqual({ length: 80, offset: 400, index: 5 });
  });

  test('farklı yükseklikler için bağımsız factory', () => {
    const m = loadModule('android');
    const a = m.fixedItemLayout(50);
    const b = m.fixedItemLayout(100);
    expect(a(null, 3)).toEqual({ length: 50, offset: 150, index: 3 });
    expect(b(null, 3)).toEqual({ length: 100, offset: 300, index: 3 });
  });

  test('data parametresi yoksa (ArrayLike) yine çalışır', () => {
    const m = loadModule('android');
    const getLayout = m.fixedItemLayout(64);
    expect(getLayout(undefined, 10)).toEqual({ length: 64, offset: 640, index: 10 });
  });

  test('büyük index için doğru offset', () => {
    const m = loadModule('android');
    const getLayout = m.fixedItemLayout(72);
    expect(getLayout(null, 999)).toEqual({ length: 72, offset: 71928, index: 999 });
  });

  test('itemHeight=1 sınır durumu', () => {
    const m = loadModule('android');
    const getLayout = m.fixedItemLayout(1);
    expect(getLayout(null, 100)).toEqual({ length: 1, offset: 100, index: 100 });
  });
});
