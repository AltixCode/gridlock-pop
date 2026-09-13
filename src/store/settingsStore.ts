import { create } from 'zustand';
import { STORAGE_KEYS, loadJson, saveJson } from '../services/storage';

export interface SettingsState {
  sound: boolean;
  haptics: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSound: (value: boolean) => Promise<void>;
  setHaptics: (value: boolean) => Promise<void>;
  resetForTests: () => void;
}

const DEFAULTS = { sound: true, haptics: true };

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    const stored = await loadJson<Partial<typeof DEFAULTS>>(STORAGE_KEYS.settings, {});
    set({
      // Only known keys are adopted, so a stale or tampered payload can't inject state.
      sound: typeof stored.sound === 'boolean' ? stored.sound : DEFAULTS.sound,
      haptics: typeof stored.haptics === 'boolean' ? stored.haptics : DEFAULTS.haptics,
      hydrated: true,
    });
  },

  setSound: async (value) => {
    set({ sound: value });
    await saveJson(STORAGE_KEYS.settings, { sound: value, haptics: get().haptics });
  },

  setHaptics: async (value) => {
    set({ haptics: value });
    await saveJson(STORAGE_KEYS.settings, { sound: get().sound, haptics: value });
  },

  resetForTests: () => set({ ...DEFAULTS, hydrated: false }),
}));
