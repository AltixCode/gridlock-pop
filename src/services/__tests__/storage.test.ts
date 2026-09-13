import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadJson, saveJson, removeKey, STORAGE_KEYS } from '../storage';

describe('storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('round-trips a value', async () => {
    await saveJson(STORAGE_KEYS.progress, { highScore: 120 });
    expect(await loadJson(STORAGE_KEYS.progress, { highScore: 0 })).toEqual({ highScore: 120 });
  });

  it('returns the fallback when nothing is stored', async () => {
    expect(await loadJson(STORAGE_KEYS.progress, { highScore: 7 })).toEqual({ highScore: 7 });
  });

  it('returns the fallback when the stored value is corrupt JSON', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.progress, '{not json');
    expect(await loadJson(STORAGE_KEYS.progress, { highScore: 0 })).toEqual({ highScore: 0 });
  });

  it('returns the fallback when the storage layer throws', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk full'));
    expect(await loadJson(STORAGE_KEYS.settings, { sound: true })).toEqual({ sound: true });
  });

  it('never throws when a write fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(saveJson(STORAGE_KEYS.settings, { sound: false })).resolves.toBe(false);
  });

  it('removes a key', async () => {
    await saveJson(STORAGE_KEYS.settings, { sound: false });
    await removeKey(STORAGE_KEYS.settings);
    expect(await loadJson(STORAGE_KEYS.settings, null)).toBeNull();
  });

  it('namespaces every key', () => {
    Object.values(STORAGE_KEYS).forEach((key) => expect(key.startsWith('blockjam.')).toBe(true));
  });
});
