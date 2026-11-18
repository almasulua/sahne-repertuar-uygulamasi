import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '../lib/offline/mmkvStorage';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export type ThemePreference = 'system' | 'light' | 'dark';

interface UIState {
  locale: 'tr' | 'en';
  theme: ThemePreference;
  toasts: Toast[];
  bottomSheetVisible: boolean;
  bottomSheetContent: string | null;
  fabVisible: boolean;
  onboardingCompleted: boolean;
  /** Bildirimleri susturulan grup id'leri */
  mutedGroupIds: string[];

  setLocale: (locale: 'tr' | 'en') => void;
  setTheme: (theme: ThemePreference) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  openBottomSheet: (content: string) => void;
  closeBottomSheet: () => void;
  setFabVisible: (visible: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  toggleMutedGroup: (groupId: string) => void;
  isGroupMuted: (groupId: string) => boolean;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      locale: 'tr',
      theme: 'system',
      toasts: [],
      bottomSheetVisible: false,
      bottomSheetContent: null,
      fabVisible: true,
      onboardingCompleted: false,
      mutedGroupIds: [],

      setLocale: (locale) => set({ locale }),

      setTheme: (theme) => set({ theme }),

      showToast: (toast) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
          ],
        })),

      hideToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      openBottomSheet: (content) =>
        set({ bottomSheetVisible: true, bottomSheetContent: content }),

      closeBottomSheet: () =>
        set({ bottomSheetVisible: false, bottomSheetContent: null }),

      setFabVisible: (fabVisible) => set({ fabVisible }),

      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),

      toggleMutedGroup: (groupId) =>
        set((s) => ({
          mutedGroupIds: s.mutedGroupIds.includes(groupId)
            ? s.mutedGroupIds.filter((id) => id !== groupId)
            : [...s.mutedGroupIds, groupId],
        })),

      isGroupMuted: (groupId) => get().mutedGroupIds.includes(groupId),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({
        locale: state.locale,
        theme: state.theme,
        onboardingCompleted: state.onboardingCompleted,
        mutedGroupIds: state.mutedGroupIds,
      }),
    }
  )
);
