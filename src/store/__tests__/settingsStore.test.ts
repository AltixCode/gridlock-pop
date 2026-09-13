import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../settingsStore';
import { STORAGE_KEYS } from '../../services/storage';

const store = () => useSettingsStore.getState();

describe('settingsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    store().resetForTests();
  });

  it('defaults sound and haptics on', () => {
    expect(store().sound).toBe(true);
    expect(store().haptics).toBe(true);
  });

  it('toggles and persists a setting', async () => {
    await store().setSound(false);
    expect(store().sound).toBe(false);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
    expect(JSON.parse(raw!)).toMatchObject({ sound: false });
  });

  it('toggles and persists haptics alongside sound', async () => {
    await store().setSound(false);
    await store().setHaptics(false);

    expect(store().haptics).toBe(false);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
    // Writing one setting must not drop the other.
    expect(JSON.parse(raw!)).toEqual({ sound: false, haptics: false });
  });

  it('hydrates persisted settings', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ sound: false, haptics: false }),
    );
    await store().hydrate();
    expect(store().sound).toBe(false);
    expect(store().haptics).toBe(false);
  });

  it('ignores unknown persisted fields', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ sound: false, bogus: 1 }));
    await store().hydrate();
    expect(store().sound).toBe(false);
    expect(store().haptics).toBe(true);
    expect((store() as unknown as Record<string, unknown>).bogus).toBeUndefined();
  });
});
