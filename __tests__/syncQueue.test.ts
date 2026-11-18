import {
  createPendingOp,
  nextRetryDelayMs,
  isOpReady,
  isOpExhausted,
  isConflict,
  MAX_RETRIES,
  type PendingOperation,
} from '../src/lib/offline/syncQueue';

// ----------------------------------------------------------------
// createPendingOp
// ----------------------------------------------------------------
describe('createPendingOp', () => {
  test('create op: temel alanlar dolu', () => {
    const op = createPendingOp('create', 'songs', { title: 'X' });
    expect(op.type).toBe('create');
    expect(op.table).toBe('songs');
    expect(op.payload).toEqual({ title: 'X' });
    expect(op.retries).toBe(0);
    expect(op.expectedUpdatedAt).toBeUndefined();
    expect(typeof op.id).toBe('string');
    expect(typeof op.timestamp).toBe('number');
  });

  test('update op: expectedUpdatedAt saklanır', () => {
    const op = createPendingOp('update', 'songs', { id: '1' }, '2026-05-26T10:00:00Z');
    expect(op.expectedUpdatedAt).toBe('2026-05-26T10:00:00Z');
  });

  test('id benzersiz', () => {
    const a = createPendingOp('create', 'songs', {});
    const b = createPendingOp('create', 'songs', {});
    expect(a.id).not.toBe(b.id);
  });
});

// ----------------------------------------------------------------
// nextRetryDelayMs (exponential backoff)
// ----------------------------------------------------------------
describe('nextRetryDelayMs', () => {
  test('0 → 1sn', () => expect(nextRetryDelayMs(0)).toBe(1000));
  test('1 → 2sn', () => expect(nextRetryDelayMs(1)).toBe(2000));
  test('2 → 4sn', () => expect(nextRetryDelayMs(2)).toBe(4000));
  test('5 → 32sn', () => expect(nextRetryDelayMs(5)).toBe(32000));
  test('8 → 256sn', () => expect(nextRetryDelayMs(8)).toBe(256000));
  test('cap: 9 → 300sn (5dk)', () => expect(nextRetryDelayMs(9)).toBe(300000));
  test('cap: 20 → 300sn (5dk)', () => expect(nextRetryDelayMs(20)).toBe(300000));
});

// ----------------------------------------------------------------
// isOpReady
// ----------------------------------------------------------------
describe('isOpReady', () => {
  const baseOp: PendingOperation = {
    id: 'x',
    type: 'create',
    table: 'songs',
    payload: {},
    timestamp: 0,
    retries: 0,
  };

  test('nextRetryAt yok → ready', () => {
    expect(isOpReady(baseOp)).toBe(true);
  });

  test('nextRetryAt gelecekte → not ready', () => {
    expect(isOpReady({ ...baseOp, nextRetryAt: 2000 }, 1000)).toBe(false);
  });

  test('nextRetryAt geçmişte → ready', () => {
    expect(isOpReady({ ...baseOp, nextRetryAt: 500 }, 1000)).toBe(true);
  });

  test('nextRetryAt == now → ready', () => {
    expect(isOpReady({ ...baseOp, nextRetryAt: 1000 }, 1000)).toBe(true);
  });
});

// ----------------------------------------------------------------
// isOpExhausted
// ----------------------------------------------------------------
describe('isOpExhausted', () => {
  const baseOp: PendingOperation = {
    id: 'x',
    type: 'create',
    table: 'songs',
    payload: {},
    timestamp: 0,
    retries: 0,
  };

  test('retries=0 → false', () => expect(isOpExhausted(baseOp)).toBe(false));
  test('retries=MAX-1 → false', () => expect(isOpExhausted({ ...baseOp, retries: MAX_RETRIES - 1 })).toBe(false));
  test('retries=MAX → true', () => expect(isOpExhausted({ ...baseOp, retries: MAX_RETRIES })).toBe(true));
  test('retries>MAX → true', () => expect(isOpExhausted({ ...baseOp, retries: MAX_RETRIES + 5 })).toBe(true));
});

// ----------------------------------------------------------------
// isConflict
// ----------------------------------------------------------------
describe('isConflict', () => {
  const updateOp: PendingOperation = {
    id: 'x',
    type: 'update',
    table: 'songs',
    payload: { id: '1' },
    timestamp: 0,
    retries: 0,
    expectedUpdatedAt: '2026-05-26T10:00:00Z',
  };

  test('server timestamp daha yeni → conflict', () => {
    expect(isConflict(updateOp, '2026-05-26T11:00:00Z')).toBe(true);
  });

  test('server timestamp eşit → not conflict', () => {
    expect(isConflict(updateOp, '2026-05-26T10:00:00Z')).toBe(false);
  });

  test('server timestamp eski → not conflict', () => {
    expect(isConflict(updateOp, '2026-05-26T09:00:00Z')).toBe(false);
  });

  test('server null → not conflict (kayıt server\'da yok)', () => {
    expect(isConflict(updateOp, null)).toBe(false);
  });

  test('expectedUpdatedAt yok → not conflict', () => {
    expect(isConflict({ ...updateOp, expectedUpdatedAt: undefined }, '2026-05-26T11:00:00Z')).toBe(false);
  });

  test('create op → conflict check yok', () => {
    expect(isConflict({ ...updateOp, type: 'create' }, '2026-05-26T11:00:00Z')).toBe(false);
  });

  test('delete op + expectedUpdatedAt + server daha yeni → conflict', () => {
    // D4: delete artık optimistic-lock'a tabidir — başkasının düzenlemesini ezmemek için
    expect(isConflict({ ...updateOp, type: 'delete' }, '2026-05-26T11:00:00Z')).toBe(true);
  });

  test('delete op expectedUpdatedAt yok → not conflict (last-write-wins korunur)', () => {
    expect(
      isConflict({ ...updateOp, type: 'delete', expectedUpdatedAt: undefined }, '2026-05-26T11:00:00Z'),
    ).toBe(false);
  });

  test('forceOverwrite → conflict atlanır', () => {
    expect(isConflict({ ...updateOp, forceOverwrite: true }, '2026-05-26T11:00:00Z')).toBe(false);
  });
});
