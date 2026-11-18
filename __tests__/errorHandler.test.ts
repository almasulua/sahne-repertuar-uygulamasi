/**
 * errorHandler testleri.
 *
 * installGlobalErrorHandler şunları yapar:
 * 1. ErrorUtils.setGlobalHandler ile RN JS global error handler'ı kaydet
 * 2. globalThis.addEventListener('unhandledrejection', …) ile promise hatalarını yakala
 * 3. İki kez çağrılırsa idempotent davran
 * 4. Hata captureException'a iletilir; orijinal handler korunur
 */

// Sentry'yi mock'la — captureException çağrılarını yakalayabilelim
const captureExceptionMock = jest.fn();
jest.mock('../src/lib/sentry', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

interface ErrorHandlerModule {
  installGlobalErrorHandler: () => void;
}

interface MockErrorUtils {
  setGlobalHandler: jest.Mock;
  getGlobalHandler: jest.Mock;
  _capturedHandler?: (error: Error, isFatal?: boolean) => void;
  _previousHandler?: (error: Error, isFatal?: boolean) => void;
}

function setupErrorUtils(prevHandler?: (error: Error, isFatal?: boolean) => void): MockErrorUtils {
  const eu: MockErrorUtils = {
    setGlobalHandler: jest.fn(),
    getGlobalHandler: jest.fn(() => prevHandler),
    _previousHandler: prevHandler,
  };
  eu.setGlobalHandler.mockImplementation((h: (error: Error, isFatal?: boolean) => void) => {
    eu._capturedHandler = h;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).ErrorUtils = eu;
  return eu;
}

function loadModule(): ErrorHandlerModule {
  let mod!: ErrorHandlerModule;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../src/lib/errorHandler');
  });
  return mod;
}

beforeEach(() => {
  captureExceptionMock.mockClear();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).ErrorUtils;
  // RN'in __DEV__ global'i node test env'inde tanımsız
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).__DEV__ = false;
});

// ----------------------------------------------------------------
// ErrorUtils setGlobalHandler
// ----------------------------------------------------------------
describe('installGlobalErrorHandler — ErrorUtils', () => {
  test('setGlobalHandler çağrılır', () => {
    const eu = setupErrorUtils();
    const m = loadModule();
    m.installGlobalErrorHandler();
    expect(eu.setGlobalHandler).toHaveBeenCalledTimes(1);
  });

  test('handler hata yakaladığında captureException çağrılır', () => {
    const eu = setupErrorUtils();
    const m = loadModule();
    m.installGlobalErrorHandler();
    const err = new Error('test crash');
    eu._capturedHandler!(err, true);
    expect(captureExceptionMock).toHaveBeenCalledWith(err, {
      fatal: true,
      source: 'ErrorUtils',
    });
  });

  test('isFatal=false → fatal: false', () => {
    const eu = setupErrorUtils();
    const m = loadModule();
    m.installGlobalErrorHandler();
    const err = new Error('non-fatal');
    eu._capturedHandler!(err, false);
    expect(captureExceptionMock).toHaveBeenCalledWith(err, {
      fatal: false,
      source: 'ErrorUtils',
    });
  });

  test('önceki handler korunur ve çağrılır (RedBox bozulmaz)', () => {
    const prevHandler = jest.fn();
    const eu = setupErrorUtils(prevHandler);
    const m = loadModule();
    m.installGlobalErrorHandler();
    const err = new Error('crash');
    eu._capturedHandler!(err, true);
    expect(prevHandler).toHaveBeenCalledWith(err, true);
  });

  test('önceki handler yoksa hata fırlatılmaz', () => {
    const eu = setupErrorUtils(undefined);
    const m = loadModule();
    m.installGlobalErrorHandler();
    expect(() => eu._capturedHandler!(new Error('x'), false)).not.toThrow();
  });
});

// ----------------------------------------------------------------
// unhandled rejection listener
// ----------------------------------------------------------------
describe('installGlobalErrorHandler — unhandledrejection', () => {
  test('addEventListener varsa unhandledrejection kaydedilir', () => {
    setupErrorUtils();
    const addEventListenerMock = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).addEventListener = addEventListenerMock;

    const m = loadModule();
    m.installGlobalErrorHandler();
    expect(addEventListenerMock).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).addEventListener;
  });

  test('Error reason → olduğu gibi captureException\'a iletilir', () => {
    setupErrorUtils();
    let captured!: (ev: { reason?: unknown }) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).addEventListener = jest.fn((_: string, h: (ev: { reason?: unknown }) => void) => {
      captured = h;
    });

    const m = loadModule();
    m.installGlobalErrorHandler();

    const err = new Error('promise reject');
    captured({ reason: err });
    expect(captureExceptionMock).toHaveBeenCalledWith(err, { source: 'unhandledRejection' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).addEventListener;
  });

  test('Error olmayan reason → Error\'a sarılır', () => {
    setupErrorUtils();
    let captured!: (ev: { reason?: unknown }) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).addEventListener = jest.fn((_: string, h: (ev: { reason?: unknown }) => void) => {
      captured = h;
    });

    const m = loadModule();
    m.installGlobalErrorHandler();

    captured({ reason: 'string error' });
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const arg = captureExceptionMock.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Error);
    expect((arg as Error).message).toBe('string error');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).addEventListener;
  });
});

// ----------------------------------------------------------------
// idempotency
// ----------------------------------------------------------------
describe('idempotency', () => {
  test('iki kez çağrılırsa ikinci çağrı no-op', () => {
    const eu = setupErrorUtils();
    const m = loadModule();
    m.installGlobalErrorHandler();
    m.installGlobalErrorHandler();
    expect(eu.setGlobalHandler).toHaveBeenCalledTimes(1);
  });
});

// ----------------------------------------------------------------
// ortam yokluğu
// ----------------------------------------------------------------
describe('graceful degradation', () => {
  test('ErrorUtils yoksa hata fırlatılmaz', () => {
    // ErrorUtils set edilmedi (beforeEach silmiş)
    const m = loadModule();
    expect(() => m.installGlobalErrorHandler()).not.toThrow();
  });

  test('addEventListener yoksa hata fırlatılmaz', () => {
    setupErrorUtils();
    // addEventListener globalThis'te yoksa try/catch ile yutulur
    const m = loadModule();
    expect(() => m.installGlobalErrorHandler()).not.toThrow();
  });
});
