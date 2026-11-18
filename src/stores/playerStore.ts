import { create } from 'zustand';
import { Config } from '../constants/config';

interface PlayerState {
  activeSongId: string | null;
  transposeSteps: number;
  capo: number;
  isAutoScrolling: boolean;
  scrollSpeed: number;
  fontSize: number;
  showChordsOnly: boolean;
  preferredInstrument: 'guitar' | 'piano';

  setActiveSong: (songId: string | null) => void;
  setTransposeSteps: (steps: number) => void;
  transposeUp: () => void;
  transposeDown: () => void;
  resetTranspose: () => void;
  setCapo: (fret: number) => void;
  capoUp: () => void;
  capoDown: () => void;
  resetCapo: () => void;
  setAutoScrolling: (active: boolean) => void;
  toggleAutoScrolling: () => void;
  setScrollSpeed: (speed: number) => void;
  setFontSize: (size: number) => void;
  toggleChordsOnly: () => void;
  setPreferredInstrument: (instrument: 'guitar' | 'piano') => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  activeSongId: null,
  transposeSteps: 0,
  capo: 0,
  isAutoScrolling: false,
  scrollSpeed: Config.autoscroll.defaultSpeed,
  fontSize: 16,
  showChordsOnly: false,
  preferredInstrument: 'guitar',

  setActiveSong: (songId) =>
    set({ activeSongId: songId, transposeSteps: 0, capo: 0, isAutoScrolling: false }),

  setTransposeSteps: (steps) => {
    const clamped = Math.max(Config.transpose.min, Math.min(Config.transpose.max, steps));
    set({ transposeSteps: clamped });
  },

  transposeUp: () => {
    const { transposeSteps } = get();
    const next = Math.min(Config.transpose.max, transposeSteps + 1);
    set({ transposeSteps: next });
  },

  transposeDown: () => {
    const { transposeSteps } = get();
    const next = Math.max(Config.transpose.min, transposeSteps - 1);
    set({ transposeSteps: next });
  },

  resetTranspose: () => set({ transposeSteps: 0 }),

  setCapo: (fret) => {
    const clamped = Math.max(Config.capo.min, Math.min(Config.capo.max, fret));
    set({ capo: clamped });
  },

  capoUp: () => {
    const { capo } = get();
    set({ capo: Math.min(Config.capo.max, capo + 1) });
  },

  capoDown: () => {
    const { capo } = get();
    set({ capo: Math.max(Config.capo.min, capo - 1) });
  },

  resetCapo: () => set({ capo: 0 }),

  setAutoScrolling: (active) => set({ isAutoScrolling: active }),

  toggleAutoScrolling: () => set((s) => ({ isAutoScrolling: !s.isAutoScrolling })),

  setScrollSpeed: (speed) =>
    set({
      scrollSpeed: Math.max(Config.autoscroll.minSpeed, Math.min(Config.autoscroll.maxSpeed, speed)),
    }),

  setFontSize: (size) => set({ fontSize: Math.max(12, Math.min(28, size)) }),

  toggleChordsOnly: () => set((s) => ({ showChordsOnly: !s.showChordsOnly })),

  setPreferredInstrument: (instrument) => set({ preferredInstrument: instrument }),
}));
