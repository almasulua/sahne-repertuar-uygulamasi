import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '../lib/offline/mmkvStorage';

export interface SongPlayStat {
  songId: string;
  count: number;
  lastPlayedAt: string; // ISO
  totalDurationSec: number;
}

interface PlayHistoryState {
  stats: Record<string, SongPlayStat>;

  recordPlay: (songId: string, durationSec?: number) => void;
  getStat: (songId: string) => SongPlayStat | undefined;
  topPlayed: (limit?: number) => SongPlayStat[];
  recent: (limit?: number) => SongPlayStat[];
  totalPlays: () => number;
  reset: () => void;
}

export const usePlayHistoryStore = create<PlayHistoryState>()(
  persist(
    (set, get) => ({
      stats: {},

      recordPlay: (songId, durationSec = 0) => {
        set((s) => {
          const existing = s.stats[songId];
          const next: SongPlayStat = {
            songId,
            count: (existing?.count ?? 0) + 1,
            lastPlayedAt: new Date().toISOString(),
            totalDurationSec: (existing?.totalDurationSec ?? 0) + durationSec,
          };
          return { stats: { ...s.stats, [songId]: next } };
        });
      },

      getStat: (songId) => get().stats[songId],

      topPlayed: (limit = 10) =>
        Object.values(get().stats)
          .sort((a, b) => b.count - a.count)
          .slice(0, limit),

      recent: (limit = 10) =>
        Object.values(get().stats)
          .sort(
            (a, b) =>
              new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime()
          )
          .slice(0, limit),

      totalPlays: () =>
        Object.values(get().stats).reduce((sum, s) => sum + s.count, 0),

      reset: () => set({ stats: {} }),
    }),
    {
      name: 'play-history-store',
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);
