import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '../lib/offline/mmkvStorage';
import {
  createPendingOp,
  isConflict,
  isOpExhausted,
  isOpReady,
  nextRetryDelayMs,
  type OperationType,
  type PendingOperation,
  type TableName,
} from '../lib/offline/syncQueue';
import { supabase } from '../api/supabase';

interface OfflineState {
  isOnline: boolean;
  /** Henüz başarılı olmamış / retry bekleyen op'lar */
  pendingOps: PendingOperation[];
  /** Server'da newer kayıt olduğu için bloke olan op'lar — kullanıcı çözmeli */
  conflictOps: PendingOperation[];
  /** Max retry'ı aşan op'lar (dead letter) */
  failedOps: PendingOperation[];
  isSyncing: boolean;

  setOnline: (online: boolean) => void;
  enqueue: (
    type: OperationType,
    table: TableName,
    payload: Record<string, unknown>,
    expectedUpdatedAt?: string,
  ) => void;
  flush: () => Promise<void>;
  resolveConflict: (id: string, strategy: 'overwrite' | 'discard') => void;
  retryFailed: (id: string) => void;
  clearCompleted: () => void;
  clearFailed: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingOps: [],
      conflictOps: [],
      failedOps: [],
      isSyncing: false,

      setOnline: (isOnline) => {
        set({ isOnline });
        if (isOnline) get().flush();
      },

      enqueue: (type, table, payload, expectedUpdatedAt) => {
        const op = createPendingOp(type, table, payload, expectedUpdatedAt);
        set((s) => ({ pendingOps: [...s.pendingOps, op] }));
      },

      flush: async () => {
        const { pendingOps, isSyncing, isOnline } = get();
        if (isSyncing || !isOnline || pendingOps.length === 0) return;

        set({ isSyncing: true });
        const now = Date.now();
        const stillPending: PendingOperation[] = [];
        const conflicts: PendingOperation[] = [];
        const failed: PendingOperation[] = [];

        for (const op of pendingOps) {
          if (!isOpReady(op, now)) {
            stillPending.push(op);
            continue;
          }

          try {
            // Conflict check (sadece update için)
            if (op.type === 'update' && op.expectedUpdatedAt && !op.forceOverwrite) {
              const rowId = op.payload.id as string | undefined;
              if (rowId) {
                const { data: current } = await sb
                  .from(op.table)
                  .select('updated_at')
                  .eq('id', rowId)
                  .maybeSingle();
                const serverUpdatedAt = (current as { updated_at?: string } | null)?.updated_at;
                if (isConflict(op, serverUpdatedAt)) {
                  conflicts.push(op);
                  continue;
                }
              }
            }

            // İşlemi gerçekleştir
            if (op.type === 'create') {
              const { error } = await sb.from(op.table).insert(op.payload);
              if (error) throw error;
            } else if (op.type === 'update') {
              const { id, ...rest } = op.payload;
              const { error } = await sb.from(op.table).update(rest).eq('id', id);
              if (error) throw error;
            } else if (op.type === 'delete') {
              const { error } = await sb.from(op.table).delete().eq('id', op.payload.id);
              if (error) throw error;
            }
            // Başarılı: kuyruktan düşür
          } catch {
            const retried: PendingOperation = {
              ...op,
              retries: op.retries + 1,
              nextRetryAt: now + nextRetryDelayMs(op.retries + 1),
            };
            if (isOpExhausted(retried)) {
              failed.push(retried);
            } else {
              stillPending.push(retried);
            }
          }
        }

        set((s) => ({
          pendingOps: stillPending,
          conflictOps: [...s.conflictOps, ...conflicts],
          failedOps: [...s.failedOps, ...failed],
          isSyncing: false,
        }));
      },

      resolveConflict: (id, strategy) => {
        const { conflictOps } = get();
        const op = conflictOps.find((o) => o.id === id);
        if (!op) return;
        if (strategy === 'discard') {
          set({ conflictOps: conflictOps.filter((o) => o.id !== id) });
        } else {
          // overwrite: forceOverwrite damgalı şekilde pendingOps'a geri al
          set((s) => ({
            conflictOps: s.conflictOps.filter((o) => o.id !== id),
            pendingOps: [
              ...s.pendingOps,
              { ...op, forceOverwrite: true, retries: 0, nextRetryAt: undefined },
            ],
          }));
          // flush'ı sonraki tick'te tetikle (storage commit sonrası)
          setTimeout(() => get().flush(), 0);
        }
      },

      retryFailed: (id) => {
        const { failedOps } = get();
        const op = failedOps.find((o) => o.id === id);
        if (!op) return;
        set((s) => ({
          failedOps: s.failedOps.filter((o) => o.id !== id),
          pendingOps: [
            ...s.pendingOps,
            { ...op, retries: 0, nextRetryAt: undefined },
          ],
        }));
        setTimeout(() => get().flush(), 0);
      },

      clearCompleted: () => set({ pendingOps: [] }),
      clearFailed: () => set({ failedOps: [] }),
    }),
    {
      name: 'offline-store',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({
        pendingOps: state.pendingOps,
        conflictOps: state.conflictOps,
        failedOps: state.failedOps,
      }),
    },
  ),
);
