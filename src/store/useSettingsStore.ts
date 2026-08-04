import { create } from 'zustand';

import type { SettingsKey, SettingsValueMap } from '@/contract/storage-types';
import { DEFAULT_SETTINGS } from '@/storage/SettingsRepository';
import { getStoreDeps } from '@/store/store-deps';

type SettingsStoreState = {
  settings: SettingsValueMap;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
};

type SettingsStoreActions = {
  load: () => Promise<void>;
  updateSettings: (patch: Partial<SettingsValueMap>) => Promise<void>;
  setTheme: (theme: SettingsValueMap['theme']) => Promise<void>;
  setDefaultFocusMinutes: (minutes: SettingsValueMap['defaultFocusMinutes']) => Promise<void>;
  setDefaultVOverC: (vOverC: number) => Promise<void>;
  setCurrentStar: (starId: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  removeSetting: (key: SettingsKey) => Promise<void>;
};

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingsKey[];

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  hydrated: false,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const { settingsRepo } = getStoreDeps();
      const entries = await Promise.all(
        SETTINGS_KEYS.map(async (key) => [key, await settingsRepo.getOrDefault(key)] as const),
      );
      const settings = Object.fromEntries(entries) as SettingsValueMap;
      if (settings.theme !== 'neutral') {
        settings.theme = 'neutral';
        await settingsRepo.set('theme', 'neutral');
      }
      set({ settings, hydrated: true, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Settings load failed',
      });
    }
  },

  updateSettings: async (patch) => {
    const { settingsRepo } = getStoreDeps();
    await settingsRepo.bulkApply(patch);
    set({ settings: { ...get().settings, ...patch } });
  },

  setTheme: async (theme) => {
    await get().updateSettings({ theme });
  },

  setDefaultFocusMinutes: async (defaultFocusMinutes) => {
    await get().updateSettings({ defaultFocusMinutes });
  },

  setDefaultVOverC: async (defaultVOverC) => {
    await get().updateSettings({ defaultVOverC });
  },

  setCurrentStar: async (starId) => {
    await get().updateSettings({ currentStarId: starId });
  },

  resetToDefaults: async () => {
    const { settingsRepo } = getStoreDeps();
    await settingsRepo.resetToDefaults();
    set({ settings: { ...DEFAULT_SETTINGS }, hydrated: true, error: null });
  },

  removeSetting: async (key) => {
    const { settingsRepo } = getStoreDeps();
    await settingsRepo.remove(key);
    set({
      settings: {
        ...get().settings,
        [key]: DEFAULT_SETTINGS[key],
      },
    });
  },
}));
