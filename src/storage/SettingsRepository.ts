import type { SettingsEntry, SettingsKey, SettingsValueMap } from '@/contract/storage-types';
import type { NovaDatabase } from '@/storage/NovaDatabase';

export const DEFAULT_SETTINGS: Readonly<SettingsValueMap> = {
  theme: 'neutral',
  defaultFocusMinutes: 25,
  defaultVOverC: 0.99,
  soundVolume: 0.6,
  musicVolume: 0.4,
  engineSoundEnabled: false,
  eventSoundsEnabled: true,
  ambientSoundType: 'none',
  enableReducedMotion: false,
  lastViewedStarId: null,
  acceptedTermsVersion: null,
  currentStarId: 'hip-sol',
  browserNotificationsEnabled: false,
};

export class SettingsRepository {
  constructor(private readonly db: NovaDatabase) {}

  async get<K extends SettingsKey>(key: K): Promise<SettingsValueMap[K] | undefined> {
    await this.db.ensureOpen();
    const row = await this.db.settings.get(key);
    return row?.value as SettingsValueMap[K] | undefined;
  }

  async getOrDefault<K extends SettingsKey>(key: K): Promise<SettingsValueMap[K]> {
    const v = await this.get(key);
    return (v ?? DEFAULT_SETTINGS[key]) as SettingsValueMap[K];
  }

  async set<K extends SettingsKey>(key: K, value: SettingsValueMap[K]): Promise<SettingsEntry<K>> {
    await this.db.ensureOpen();
    const row: SettingsEntry<K> = {
      key,
      value,
      updatedAt: Date.now(),
    };
    await this.db.settings.put(row as SettingsEntry);
    return row;
  }

  async getAll(): Promise<SettingsEntry[]> {
    await this.db.ensureOpen();
    return this.db.settings.orderBy('key').toArray();
  }

  async remove(key: SettingsKey): Promise<boolean> {
    await this.db.ensureOpen();
    const existing = await this.get(key);
    if (existing == null) return false;
    await this.db.settings.delete(key);
    return true;
  }

  async resetToDefaults(): Promise<void> {
    await this.db.ensureOpen();
    await this.db.settings.clear();
    const keys = Object.keys(DEFAULT_SETTINGS) as SettingsKey[];
    const now = Date.now();
    const rows = keys.map(
      (k) => ({ key: k, value: DEFAULT_SETTINGS[k], updatedAt: now }) as SettingsEntry,
    );
    await this.db.settings.bulkPut(rows);
  }

  async bulkApply(patch: Partial<SettingsValueMap>): Promise<void> {
    await this.db.ensureOpen();
    const entries: SettingsEntry[] = [];
    const now = Date.now();
    for (const k of Object.keys(patch) as SettingsKey[]) {
      const v = patch[k];
      if (v === undefined) continue;
      entries.push({ key: k, value: v, updatedAt: now });
    }
    if (entries.length === 0) return;
    await this.db.settings.bulkPut(entries);
  }
}
