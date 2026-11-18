import { create } from 'zustand';

interface StageState {
  isStageMode: boolean;
  currentItemIndex: number;
  stageFontSize: number;
  /** Sahne modu başlama timestamp'i (ms). null = aktif değil. */
  stageStartedAt: number | null;
  /** Şarkı başına geçen süre (ms). itemId → ms */
  songDurations: Record<string, number>;
  /** O an aktif şarkıya başlanma timestamp'i */
  currentSongStartedAt: number | null;

  enterStageMode: () => void;
  exitStageMode: () => void;
  setCurrentItemIndex: (index: number) => void;
  nextItem: (maxIndex: number) => void;
  prevItem: () => void;
  setStageFontSize: (size: number) => void;
  recordSongDuration: (itemId: string) => void;
  startCurrentSongTimer: () => void;
}

export const useStageStore = create<StageState>((set, get) => ({
  isStageMode: false,
  currentItemIndex: 0,
  stageFontSize: 22,
  stageStartedAt: null,
  songDurations: {},
  currentSongStartedAt: null,

  enterStageMode: () =>
    set({
      isStageMode: true,
      currentItemIndex: 0,
      stageStartedAt: Date.now(),
      songDurations: {},
      currentSongStartedAt: Date.now(),
    }),

  exitStageMode: () =>
    set({
      isStageMode: false,
      currentItemIndex: 0,
      stageStartedAt: null,
      currentSongStartedAt: null,
    }),

  setCurrentItemIndex: (index) => set({ currentItemIndex: index }),

  nextItem: (maxIndex) => {
    const { currentItemIndex } = get();
    if (currentItemIndex < maxIndex) set({ currentItemIndex: currentItemIndex + 1 });
  },

  prevItem: () => {
    const { currentItemIndex } = get();
    if (currentItemIndex > 0) set({ currentItemIndex: currentItemIndex - 1 });
  },

  setStageFontSize: (size) => set({ stageFontSize: Math.max(16, Math.min(40, size)) }),

  recordSongDuration: (itemId) => {
    const { currentSongStartedAt, songDurations } = get();
    if (!currentSongStartedAt) return;
    const elapsed = Date.now() - currentSongStartedAt;
    set({
      songDurations: {
        ...songDurations,
        [itemId]: (songDurations[itemId] ?? 0) + elapsed,
      },
      currentSongStartedAt: Date.now(),
    });
  },

  startCurrentSongTimer: () => set({ currentSongStartedAt: Date.now() }),
}));
