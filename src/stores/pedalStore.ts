import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '../lib/offline/mmkvStorage';
import { DEFAULT_PRESET_ID, type PedalKeyMapping } from '../lib/pedal/types';

interface PedalState {
  /** Pedal entegrasyonu kullanıcı tarafından aktif edildi mi */
  enabled: boolean;
  /** Seçili preset (custom mapping yoksa bu kullanılır) */
  presetId: string;
  /** Kullanıcının preset üzerine yazdığı özel eşlemeler (boş objesi de geçerli — preset kullanılır) */
  customMapping: PedalKeyMapping;

  setEnabled: (v: boolean) => void;
  setPreset: (presetId: string) => void;
  setKeyMapping: (keyCode: string, action: PedalKeyMapping[string]) => void;
  clearKeyMapping: (keyCode: string) => void;
  resetToPreset: () => void;
}

export const usePedalStore = create<PedalState>()(
  persist(
    (set) => ({
      enabled: false,
      presetId: DEFAULT_PRESET_ID,
      customMapping: {},

      setEnabled: (enabled) => set({ enabled }),

      setPreset: (presetId) => set({ presetId, customMapping: {} }),

      setKeyMapping: (keyCode, action) =>
        set((s) => ({ customMapping: { ...s.customMapping, [keyCode]: action } })),

      clearKeyMapping: (keyCode) =>
        set((s) => {
          const next = { ...s.customMapping };
          delete next[keyCode];
          return { customMapping: next };
        }),

      resetToPreset: () => set({ customMapping: {} }),
    }),
    {
      name: 'pedal-store',
      storage: createJSONStorage(() => zustandMmkvStorage),
    },
  ),
);
