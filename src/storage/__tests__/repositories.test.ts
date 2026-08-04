import type { SettingsKey } from '@/contract/storage-types';
import type { VoyageSnapshot } from '@/engine/contract/voyage-types';
import { VoyageController } from '@/engine/navigation/VoyageController';
import { DEFAULT_SETTINGS, SettingsRepository } from '@/storage/SettingsRepository';
import { NovaDatabase } from '@/storage/NovaDatabase';
import { VoyageRepository } from '@/storage/VoyageRepository';
import { describe, expect, it } from 'vitest';

function sampleCompletedSnapshot(
  createdAt: number,
  startWallTime: number,
  focusMin: number,
  vOverC: number,
  travelLy: number,
): VoyageSnapshot {
  const ctrl = new VoyageController({ focusMinutes: focusMin, vOverC });
  void ctrl;
  return {
    version: 1,
    createdAt,
    opts: {
      vOverC,
      tickIntervalMs: 250,
      infinite: false,
      focusTotalMs: focusMin * 60 * 1000,
    },
    state: {
      status: 'completed',
      elapsedFocusMs: focusMin * 60 * 1000,
      traveledLy: travelLy,
      startWallTime,
      lastTickWallTime: startWallTime + focusMin * 60 * 1000,
      pausedSegments: [],
      currentPauseStart: null,
    },
  };
}

describe('VoyageRepository (Dexie IndexedDB CRUD · fake-indexeddb)', () => {
  it('save → getById → 记录完整字段一致，list createdAt_desc 排序正确', async () => {
    await NovaDatabase.temp('nova-voy-test1', async (db) => {
      const repo = new VoyageRepository(db);
      const snapA = sampleCompletedSnapshot(1_700_000_000_000, 1_700_000_000_000, 25, 0.99, 0.0202);
      const snapB = sampleCompletedSnapshot(1_700_001_000_000, 1_700_001_000_000, 60, 0.99, 0.0808);
      const a = await repo.save({
        snapshot: snapA,
        originStar: { id: 'hip-sol' },
        destStar: { id: 'hip-70890' },
      });
      const b = await repo.save({
        snapshot: snapB,
        originStar: { id: 'hip-sol' },
        destStar: { id: 'hip-1475' },
        createdAtOverride: snapB.createdAt,
      });
      expect(a.status).toBe('completed');
      expect(a.originStarId).toBe('hip-sol');
      expect(a.destStarId).toBe('hip-70890');
      expect(a.traveledLy).toBeCloseTo(0.0202, 6);
      expect(a.snapshot).toEqual(snapA);
      const byId = await repo.getById(b.id);
      expect(byId).toBeDefined();
      expect(byId!.destStarId).toBe('hip-1475');
      const list = await repo.list();
      expect(list.map((v) => v.id)).toEqual([b.id, a.id]);
      expect(list).toHaveLength(2);
      const stats = await repo.stats();
      expect(stats.total).toBe(2);
      expect(stats.completedVoyages).toBe(2);
      expect(stats.totalTraveledLy).toBeCloseTo(0.0202 + 0.0808, 6);
      expect(stats.totalFocusHours).toBeCloseTo((25 + 60) / 60, 6);
    });
  });

  it('list 三种 order 正确 + statusIn 过滤 completed + limit/offset 分页', async () => {
    await NovaDatabase.temp('nova-voy-test2', async (db) => {
      const repo = new VoyageRepository(db);
      const t0 = 1_600_000_000_000;
      const s = (i: number) =>
        sampleCompletedSnapshot(t0 + i * 1000, t0 + i * 1000, 25, 0.99, 1 + i);
      for (let i = 0; i < 6; i++) {
        await repo.save({ snapshot: s(i), createdAtOverride: s(i).createdAt });
      }
      // abort 1 条手动造
      const aborted: VoyageSnapshot = {
        ...s(6),
        state: {
          ...s(6).state,
          status: 'aborted',
          elapsedFocusMs: 10 * 60 * 1000,
          traveledLy: 0.01,
        },
      };
      await repo.save({ snapshot: aborted, createdAtOverride: aborted.createdAt });
      const byTraveledDesc = await repo.list({ order: 'traveledLy_desc', limit: 3 });
      expect(byTraveledDesc.map((r) => r.traveledLy)).toEqual([6, 5, 4]);
      const completedOnly = await repo.list({ statusIn: ['completed'] });
      expect(completedOnly).toHaveLength(6);
      const abortsOnly = await repo.list({ statusIn: ['aborted'] });
      expect(abortsOnly).toHaveLength(1);
      expect(abortsOnly[0]!.traveledLy).toBeCloseTo(0.01, 6);
      const page0 = await repo.list({ order: 'startWallTime_asc', limit: 2, offset: 0 });
      const page1 = await repo.list({ order: 'startWallTime_asc', limit: 2, offset: 2 });
      expect(page0[0]!.traveledLy).toBe(1);
      expect(page0[1]!.traveledLy).toBe(2);
      expect(page1[0]!.traveledLy).toBe(3);
    });
  });

  it('delete 不存在返回 false；存在删除后 getById 返回 undefined + clearAll', async () => {
    await NovaDatabase.temp('nova-voy-test3', async (db) => {
      const repo = new VoyageRepository(db);
      const snap = sampleCompletedSnapshot(1_500_000_000_000, 1_500_000_000_000, 25, 0.99, 0.02);
      const r = await repo.save({ snapshot: snap });
      expect(await repo.delete('xxx')).toBe(false);
      expect(await repo.delete(r.id)).toBe(true);
      expect(await repo.getById(r.id)).toBeUndefined();
      await repo.save({ snapshot: snap });
      await repo.clearAll();
      expect(await repo.list()).toHaveLength(0);
    });
  });
});

describe('SettingsRepository (KV 偏好设置 · fake-indexeddb)', () => {
  it('set → get 完全对拍；getOrDefault 无值时返回 DEFAULT_SETTINGS，bulkApply 部分更新', async () => {
    await NovaDatabase.temp('nova-set-test1', async (db) => {
      const repo = new SettingsRepository(db);
      expect(await repo.getOrDefault('theme')).toBe(DEFAULT_SETTINGS.theme);
      expect(await repo.get('theme')).toBeUndefined();
      const row = await repo.set('theme', 'neutral');
      expect(row.key).toBe('theme');
      expect(row.value).toBe('neutral');
      expect(await repo.get('theme')).toBe('neutral');
      await repo.bulkApply({ defaultFocusMinutes: 45, defaultVOverC: 0.999 });
      const all = await repo.getAll();
      expect(all).toHaveLength(3);
      expect(all.map((s) => s.key).sort()).toEqual([
        'defaultFocusMinutes',
        'defaultVOverC',
        'theme',
      ]);
      expect(await repo.getOrDefault('defaultFocusMinutes')).toBe(45);
      expect(await repo.getOrDefault('defaultVOverC')).toBeCloseTo(0.999, 6);
      expect(await repo.getOrDefault('soundVolume')).toBeCloseTo(DEFAULT_SETTINGS.soundVolume, 6);
    });
  });

  it('remove 存在/不存在分支 + resetToDefaults 后 8 键齐全', async () => {
    await NovaDatabase.temp('nova-set-test2', async (db) => {
      const repo = new SettingsRepository(db);
      await repo.set('theme', 'neutral');
      await repo.set('soundVolume', 0.9);
      expect(await repo.remove('theme')).toBe(true);
      expect(await repo.remove('theme')).toBe(false);
      expect(await repo.get('theme')).toBeUndefined();
      await repo.resetToDefaults();
      const all = await repo.getAll();
      const keyCount = Object.keys(DEFAULT_SETTINGS).length;
      expect(all).toHaveLength(keyCount);
      for (const k of Object.keys(DEFAULT_SETTINGS) as SettingsKey[]) {
        const row = all.find((a) => a.key === k);
        expect(row).toBeDefined();
        expect(row!.value).toEqual(DEFAULT_SETTINGS[k]);
      }
    });
  });
});
