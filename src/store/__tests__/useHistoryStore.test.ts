import type { VoyageSnapshot } from '@/engine/contract/voyage-types';
import { NovaDatabase } from '@/storage/NovaDatabase';
import { SettingsRepository } from '@/storage/SettingsRepository';
import { VoyageRepository } from '@/storage/VoyageRepository';
import { resetStoreDepsForTest, setStoreDepsForTest, useHistoryStore } from '@/store/index';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

function sampleSnapshot(
  createdAt: number,
  traveledLy: number,
  status: 'completed' | 'aborted',
): VoyageSnapshot {
  return {
    version: 1,
    createdAt,
    opts: {
      vOverC: 0.99,
      tickIntervalMs: 250,
      infinite: false,
      focusTotalMs: 25 * 60 * 1000,
    },
    state: {
      status,
      elapsedFocusMs: 25 * 60 * 1000,
      traveledLy,
      startWallTime: createdAt,
      lastTickWallTime: createdAt + 25 * 60 * 1000,
      pausedSegments: [],
      currentPauseStart: null,
    },
  };
}

function resetHistoryStore(): void {
  useHistoryStore.setState({
    records: [],
    stats: null,
    loading: false,
    error: null,
  });
}

describe('useHistoryStore (Zustand · VoyageRepository list/stats)', () => {
  beforeEach(() => {
    resetHistoryStore();
    resetStoreDepsForTest();
  });

  afterEach(() => {
    resetHistoryStore();
    resetStoreDepsForTest();
  });

  it('load 拉取 createdAt_desc 排序 + stats 统计', async () => {
    await NovaDatabase.temp('nova-hist-store-1', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({
        db,
        voyageRepo,
        settingsRepo: new SettingsRepository(db),
      });

      const snapA = sampleSnapshot(1_700_000_000_000, 0.02, 'completed');
      const snapB = sampleSnapshot(1_700_001_000_000, 0.08, 'completed');
      await voyageRepo.save({ snapshot: snapA, originStar: { id: 'hip-sol' } });
      await voyageRepo.save({ snapshot: snapB, originStar: { id: 'hip-sol' } });

      await useHistoryStore.getState().load();

      const { records, stats, loading } = useHistoryStore.getState();
      expect(loading).toBe(false);
      expect(records).toHaveLength(2);
      expect(records[0]!.traveledLy).toBeCloseTo(0.08, 6);
      expect(records[1]!.traveledLy).toBeCloseTo(0.02, 6);
      expect(stats!.total).toBe(2);
      expect(stats!.completedVoyages).toBe(2);
    });
  });

  it('refresh 重新拉取最新列表', async () => {
    await NovaDatabase.temp('nova-hist-store-2', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({
        db,
        voyageRepo,
        settingsRepo: new SettingsRepository(db),
      });

      await useHistoryStore.getState().load();
      expect(useHistoryStore.getState().records).toHaveLength(0);

      await voyageRepo.save({
        snapshot: sampleSnapshot(1_600_000_000_000, 0.01, 'completed'),
      });
      await useHistoryStore.getState().refresh();
      expect(useHistoryStore.getState().records).toHaveLength(1);
    });
  });

  it('loadStats 单独更新 stats 字段', async () => {
    await NovaDatabase.temp('nova-hist-store-3', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({
        db,
        voyageRepo,
        settingsRepo: new SettingsRepository(db),
      });

      await voyageRepo.save({
        snapshot: sampleSnapshot(1_600_000_000_000, 0.05, 'completed'),
      });

      await useHistoryStore.getState().loadStats();
      expect(useHistoryStore.getState().stats!.totalTraveledLy).toBeCloseTo(0.05, 6);
    });
  });

  it('deleteRecord 删除后 records 移除且 stats 更新', async () => {
    await NovaDatabase.temp('nova-hist-store-4', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({
        db,
        voyageRepo,
        settingsRepo: new SettingsRepository(db),
      });

      const saved = await voyageRepo.save({
        snapshot: sampleSnapshot(1_600_000_000_000, 0.03, 'completed'),
      });
      await useHistoryStore.getState().load();
      expect(useHistoryStore.getState().records).toHaveLength(1);

      const ok = await useHistoryStore.getState().deleteRecord(saved.id);
      expect(ok).toBe(true);
      expect(useHistoryStore.getState().records).toHaveLength(0);
      expect(useHistoryStore.getState().stats!.total).toBe(0);
    });
  });

  it('clearAll 清空全部记录', async () => {
    await NovaDatabase.temp('nova-hist-store-5', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({
        db,
        voyageRepo,
        settingsRepo: new SettingsRepository(db),
      });

      await voyageRepo.save({
        snapshot: sampleSnapshot(1_600_000_000_000, 0.01, 'completed'),
      });
      await useHistoryStore.getState().load();
      await useHistoryStore.getState().clearAll();

      expect(useHistoryStore.getState().records).toHaveLength(0);
      expect(useHistoryStore.getState().stats!.total).toBe(0);
    });
  });

  it('loadPage limit/offset 分页正确', async () => {
    await NovaDatabase.temp('nova-hist-store-6', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({
        db,
        voyageRepo,
        settingsRepo: new SettingsRepository(db),
      });

      for (let i = 0; i < 5; i++) {
        await voyageRepo.save({
          snapshot: sampleSnapshot(1_600_000_000_000 + i * 1000, 1 + i, 'completed'),
        });
      }

      await useHistoryStore.getState().loadPage({ limit: 2, offset: 1 });
      const records = useHistoryStore.getState().records;
      expect(records).toHaveLength(2);
      expect(records[0]!.traveledLy).toBeCloseTo(4, 6);
      expect(records[1]!.traveledLy).toBeCloseTo(3, 6);
    });
  });
});
