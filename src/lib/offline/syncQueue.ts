/**
 * Çevrimdışı yazma kuyruğu + conflict resolution.
 * Online olunca replay edilecek işlemleri saklar.
 */
export type OperationType = 'create' | 'update' | 'delete';
export type TableName = 'songs' | 'personal_songs' | 'group_songs' | 'messages';

export interface PendingOperation {
  id: string;
  type: OperationType;
  table: TableName;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
  /**
   * Update/delete op'larında, mutation enqueue edildiğinde okunan kayıdın `updated_at` değeri.
   * Flush sırasında server'daki güncel `updated_at` bu değerden büyükse conflict olarak işaretlenir.
   * (delete için: başkası bizim okumamızdan sonra düzenlemişse silmeyi clobber etmemek için.)
   */
  expectedUpdatedAt?: string;
  /** Exponential backoff: bu zamandan önce flush denemesi yapılmaz (Date.now()). */
  nextRetryAt?: number;
  /** Conflict çözümünde 'overwrite' seçilmişse expectedUpdatedAt check'i atlanır. */
  forceOverwrite?: boolean;
}

export const MAX_RETRIES = 5;

/** Yeni bir bekleyen işlem nesnesi oluşturur. */
export function createPendingOp(
  type: OperationType,
  table: TableName,
  payload: Record<string, unknown>,
  expectedUpdatedAt?: string,
): PendingOperation {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    table,
    payload,
    timestamp: Date.now(),
    retries: 0,
    expectedUpdatedAt,
  };
}

/**
 * Exponential backoff hesaplar: 2^retries saniye (üst sınır 5 dk).
 * retries=0 → ~1sn, retries=1 → 2sn, retries=5 → 32sn, retries=8 → 256sn (4.3dk, cap).
 */
export function nextRetryDelayMs(retries: number): number {
  const seconds = Math.min(2 ** retries, 300);
  return seconds * 1000;
}

/** Op şu an retry edilebilir mi (nextRetryAt geçti mi) */
export function isOpReady(op: PendingOperation, now: number = Date.now()): boolean {
  if (op.nextRetryAt === undefined) return true;
  return now >= op.nextRetryAt;
}

/** Op max retry'a ulaştı mı (dead letter'a taşınmalı mı) */
export function isOpExhausted(op: PendingOperation): boolean {
  return op.retries >= MAX_RETRIES;
}

/**
 * Conflict tespiti: server'dan dönen kayıdın updated_at'ı op'un expectedUpdatedAt'ından büyükse
 * başkası bizim okumamızdan sonra yazmış demektir. forceOverwrite atlatır.
 *
 * Hem `update` hem `delete` op'larına uygulanır (delete bir kaydı silmeden önce başkasının
 * düzenlemesini ezmemeli). `create` op'larında ve expectedUpdatedAt taşımayan op'larda
 * conflict yoktur (geriye uyumlu last-write-wins).
 */
export function isConflict(
  op: PendingOperation,
  serverUpdatedAt: string | null | undefined,
): boolean {
  if (op.forceOverwrite) return false;
  if (op.type !== 'update' && op.type !== 'delete') return false;
  if (!op.expectedUpdatedAt || !serverUpdatedAt) return false;
  return new Date(serverUpdatedAt).getTime() > new Date(op.expectedUpdatedAt).getTime();
}
