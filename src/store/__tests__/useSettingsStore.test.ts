import type { SettingsValueMap } from '@/contract/storage-types';
import { NovaDatabase } from '@/storage/NovaDatabase';
import { SettingsRepository, DEFAULT_SETTINGS } from '@/storage/SettingsRepository';
import { VoyageRepository } from '@/storage/VoyageRepository';
import { resetStoreDepsForTest, setStoreDepsForTest, useSettingsStore } from '@/store/index';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

function resetSettingsStore(): void {
  useSettingsStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    hydrated: false,
    loading: false,
    error: null,
  });
}

describe('useSettingsStore (Zustand · SettingsRepository 批量 hydration)', () => {
  beforeEach(() => {
    resetSettingsStore();
    resetStoreDepsForTest();
  });

  afterEach(() => {
    resetSettingsStore();
    resetStoreDepsForTest();
  });

  it('load 从 Dexie getOrDefault 批量加载 8 键，hydrated=true', async () => {
    await NovaDatabase.temp('nova-set-store-1', async (db) => {
      const settingsRepo = new SettingsRepository(db);
      await settingsRepo.set('theme', 'neutral');
      await settingsRepo.set('defaultFocusMinutes', 45);
      setStoreDepsForTest({
        db,
        settingsRepo,
        voyageRepo: new VoyageRepository(db),
      });

      await useSettingsStore.getState().load();

      const { settings, hydrated, loading } = useSettingsStore.getState();
      expect(hydrated).toBe(true);
      expect(loading).toBe(false);
      expect(settings.theme).toBe('neutral');
      expect(settings.defaultFocusMinutes).toBe(45);
      expect(settings.soundVolume).toBeCloseTo(DEFAULT_SETTINGS.soundVolume, 6);
    });
  });

  it('updateSettings bulkApply 后内存与 Dexie 一致', async () => {
    await NovaDatabase.temp('nova-set-store-2', async (db) => {
      const settingsRepo = new SettingsRepository(db);
      setStoreDepsForTest({
        db,
        settingsRepo,
        voyageRepo: new VoyageRepository(db),
      });

      await useSettingsStore.getState().updateSettings({
        theme: 'neutral',
        musicVolume: 0.2,
      });

      expect(useSettingsStore.getState().settings.theme).toBe('neutral');
      expect(useSettingsStore.getState().settings.musicVolume).toBeCloseTo(0.2, 6);
      expect(await settingsRepo.get('theme')).toBe('neutral');
      expect(await settingsRepo.get('musicVolume')).toBeCloseTo(0.2, 6);
    });
  });

  it('setTheme / setDefaultFocusMinutes / setDefaultVOverC 单项更新正确', async () => {
    await NovaDatabase.temp('nova-set-store-3', async (db) => {
      const settingsRepo = new SettingsRepository(db);
      setStoreDepsForTest({
        db,
        settingsRepo,
        voyageRepo: new VoyageRepository(db),
      });

      await useSettingsStore.getState().setTheme('neutral');
      await useSettingsStore.getState().setDefaultFocusMinutes(60);
      await useSettingsStore.getState().setDefaultVOverC(0.999);

      const s = useSettingsStore.getState().settings;
      expect(s.theme).toBe('neutral');
      expect(s.defaultFocusMinutes).toBe(60);
      expect(s.defaultVOverC).toBeCloseTo(0.999, 6);
    });
  });

  it('resetToDefaults 恢复 8 键默认值', async () => {
    await NovaDatabase.temp('nova-set-store-4', async (db) => {
      const settingsRepo = new SettingsRepository(db);
      setStoreDepsForTest({
        db,
        settingsRepo,
        voyageRepo: new VoyageRepository(db),
      });

      await useSettingsStore.getState().updateSettings({ theme: 'neutral', soundVolume: 0.1 });
      await useSettingsStore.getState().resetToDefaults();

      const s = useSettingsStore.getState().settings;
      expect(s).toEqual(DEFAULT_SETTINGS);
      expect(await settingsRepo.getOrDefault('theme')).toBe('neutral');
    });
  });

  it('removeSetting 删除后回退 DEFAULT_SETTINGS 对应键', async () => {
    await NovaDatabase.temp('nova-set-store-5', async (db) => {
      const settingsRepo = new SettingsRepository(db);
      setStoreDepsForTest({
        db,
        settingsRepo,
        voyageRepo: new VoyageRepository(db),
      });

      await settingsRepo.set('theme', 'neutral');
      await useSettingsStore.getState().load();
      expect(useSettingsStore.getState().settings.theme).toBe('neutral');

      await useSettingsStore.getState().removeSetting('theme');
      expect(useSettingsStore.getState().settings.theme).toBe(DEFAULT_SETTINGS.theme);
      expect(await settingsRepo.get('theme')).toBeUndefined();
    });
  });

  it('旧主题值（如 retro）在 load 时迁移为 neutral 并持久化', async () => {
    await NovaDatabase.temp('nova-set-store-6', async (db) => {
      const settingsRepo = new SettingsRepository(db);
      setStoreDepsForTest({
        db,
        settingsRepo,
        voyageRepo: new VoyageRepository(db),
      });

      await settingsRepo.set('theme', 'retro' as SettingsValueMap['theme']);
      await useSettingsStore.getState().load();

      expect(useSettingsStore.getState().settings.theme).toBe('neutral');
      expect(await settingsRepo.get('theme')).toBe('neutral');
    });
  });
});
