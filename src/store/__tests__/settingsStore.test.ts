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
    expect((store() as Record<string, unknown>).bogus).toBeUndefined();
  });
});
