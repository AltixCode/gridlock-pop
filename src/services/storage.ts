import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  progress: 'blockjam.progress.v1',
  settings: 'blockjam.settings.v1',
  ads: 'blockjam.ads.v1',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Reads and parses a JSON value; any failure (missing, corrupt, unavailable) yields the fallback. */
export async function loadJson<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Persists a JSON value. Returns false instead of throwing when storage is unavailable. */
export async function saveJson(key: StorageKey, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeKey(key: StorageKey): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
