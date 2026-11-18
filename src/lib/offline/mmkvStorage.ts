/**
 * Depolama adaptörü — MMKV (development build) veya in-memory fallback (Expo Go).
 *
 * react-native-mmkv@4 nitro-modules tabanlı; Expo Go'da native modül yok.
 * Bu nedenle require'ı Expo Go kontrolünden sonra yapıyoruz, aksi halde
 * modül init sırasında native lookup crash'i oluşur.
 */
import Constants from 'expo-constants';

type SyncStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

// In-memory fallback (Expo Go / jest ortamı)
const memStore = new Map<string, string>();
const memoryStorage: SyncStorage = {
  getItem: (k) => memStore.get(k) ?? null,
  setItem: (k, v) => { memStore.set(k, v); },
  removeItem: (k) => { memStore.delete(k); },
};

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function createStorage(): SyncStorage {
  if (isExpoGo()) return memoryStorage;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = createMMKV({ id: 'muzik-app-storage' });
    return {
      getItem: (k) => mmkv.getString(k) ?? null,
      setItem: (k, v) => mmkv.set(k, v),
      removeItem: (k) => { mmkv.remove(k); },
    };
  } catch {
    return memoryStorage;
  }
}

const storage = createStorage();

/** TanStack Query AsyncStorage-compatible persister adaptörü */
export const mmkvStorageAdapter: SyncStorage = storage;

/** Zustand persist storage */
export const zustandMmkvStorage: SyncStorage = storage;
