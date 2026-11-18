import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '../lib/offline/mmkvStorage';

export interface SongRecording {
  id: string;
  songId: string;
  uri: string;
  createdAt: string; // ISO
  durationMs: number;
  label?: string;
}

interface RecordingsState {
  recordings: Record<string, SongRecording[]>; // songId → recordings

  add: (songId: string, recording: Omit<SongRecording, 'id' | 'songId' | 'createdAt'>) => SongRecording;
  remove: (songId: string, recordingId: string) => void;
  rename: (songId: string, recordingId: string, label: string) => void;
  forSong: (songId: string) => SongRecording[];
}

export const useRecordingsStore = create<RecordingsState>()(
  persist(
    (set, get) => ({
      recordings: {},

      add: (songId, partial) => {
        const recording: SongRecording = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          songId,
          createdAt: new Date().toISOString(),
          ...partial,
        };
        set((s) => ({
          recordings: {
            ...s.recordings,
            [songId]: [recording, ...(s.recordings[songId] ?? [])],
          },
        }));
        return recording;
      },

      remove: (songId, recordingId) => {
        set((s) => ({
          recordings: {
            ...s.recordings,
            [songId]: (s.recordings[songId] ?? []).filter((r) => r.id !== recordingId),
          },
        }));
      },

      rename: (songId, recordingId, label) => {
        set((s) => ({
          recordings: {
            ...s.recordings,
            [songId]: (s.recordings[songId] ?? []).map((r) =>
              r.id === recordingId ? { ...r, label } : r
            ),
          },
        }));
      },

      forSong: (songId) => get().recordings[songId] ?? [],
    }),
    {
      name: 'recordings-store',
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);
