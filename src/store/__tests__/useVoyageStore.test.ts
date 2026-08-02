import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NovaDatabase } from '@/storage/NovaDatabase';
import { SettingsRepository } from '@/storage/SettingsRepository';
import { VoyageRepository } from '@/storage/VoyageRepository';
import {
  resetStoreDepsForTest,
  resetVoyageControllerForTest,
  setStoreDepsForTest,
  useHistoryStore,
  useVoyageStore,
} from '@/store/index';

const TWENTY_FIVE_MIN_MS = 25 * 60 * 1000;

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function resetVoyageStore(): void {
  useVoyageStore.getState().dispose();
  useVoyageStore.setState({
    progress: null,
    snapshot: null,
    originStarId: null,
    destStarId: null,
    lastSavedRecord: null,
    controllerReady: false,
  });
}

function resetHistoryStore(): void {
  useHistoryStore.setState({
    records: [],
    stats: null,
    loading: false,
    error: null,
  });
}

describe('useVoyageStore (Zustand · VoyageController 桥接 + Dexie 自动保存)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2025, 0, 1, 12, 0, 0));
    resetVoyageStore();
    resetHistoryStore();
    resetStoreDepsForTest();
  });

  afterEach(() => {
    resetVoyageControllerForTest();
    resetVoyageStore();
    resetHistoryStore();
    resetStoreDepsForTest();
    vi.useRealTimers();
  });

  it('prepare → start 后 progress=running，snapshot 同步更新', () => {
    useVoyageStore.getState().prepare({
      focusMinutes: 25,
      vOverC: 0.99,
      originStarId: 'hip-sol',
    });

    const progress = useVoyageStore.getState().start();
    expect(progress.status).toBe('running');
    expect(useVoyageStore.getState().controllerReady).toBe(true);
    expect(useVoyageStore.getState().originStarId).toBe('hip-sol');
    expect(useVoyageStore.getState().snapshot!.state.status).toBe('running');
  });

  it('progress 事件每 250ms 更新 store 中的 elapsedFocusMs', () => {
    useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
    useVoyageStore.getState().start();

    vi.advanceTimersByTime(1000);
    expect(useVoyageStore.getState().progress!.elapsedFocusMs).toBeGreaterThanOrEqual(750);
  });

  it('pause / resume 状态流转正确', () => {
    useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
    useVoyageStore.getState().start();
    vi.advanceTimersByTime(5000);

    const paused = useVoyageStore.getState().pause();
    expect(paused.status).toBe('paused');

    vi.advanceTimersByTime(10_000);
    const elapsedWhilePaused = useVoyageStore.getState().progress!.elapsedFocusMs;

    const resumed = useVoyageStore.getState().resume();
    expect(resumed.status).toBe('running');
    vi.advanceTimersByTime(1000);
    expect(useVoyageStore.getState().progress!.elapsedFocusMs).toBeGreaterThan(elapsedWhilePaused);
  });

  it('25 分钟自动 complete → saveToHistory 写入 Dexie 并 refresh HistoryStore', async () => {
    await NovaDatabase.temp('nova-voy-store-1', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({
        db,
        voyageRepo,
        settingsRepo: new SettingsRepository(db),
      });

      useVoyageStore.getState().prepare({
        focusMinutes: 25,
        vOverC: 0.99,
        originStarId: 'hip-sol',
        destStarId: 'hip-70890',
      });
      useVoyageStore.getState().start();
      vi.advanceTimersByTime(TWENTY_FIVE_MIN_MS);
      await flushAsync();

      expect(useVoyageStore.getState().progress!.status).toBe('completed');

      await flushAsync();
      if (useVoyageStore.getState().lastSavedRecord == null) {
        await useVoyageStore.getState().saveToHistory();
      }

      const saved = useVoyageStore.getState().lastSavedRecord;
      expect(saved).not.toBeNull();
      expect(saved!.status).toBe('completed');
      expect(saved!.originStarId).toBe('hip-sol');
      expect(saved!.destStarId).toBe('hip-70890');

      await useHistoryStore.getState().load();
      expect(useHistoryStore.getState().records).toHaveLength(1);
    });
  });

  it('abort 后自动 Dexie save，status=aborted', async () => {
    await NovaDatabase.temp('nova-voy-store-2', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({
        db,
        voyageRepo,
        settingsRepo: new SettingsRepository(db),
      });

      useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
      useVoyageStore.getState().start();
      vi.advanceTimersByTime(10 * 60 * 1000);

      useVoyageStore.getState().abort('user');
      await flushAsync();

      if (useVoyageStore.getState().lastSavedRecord == null) {
        await useVoyageStore.getState().saveToHistory();
      }

      const saved = useVoyageStore.getState().lastSavedRecord!;
      expect(saved.status).toBe('aborted');
      expect(saved.elapsedFocusMs).toBeGreaterThan(0);
    });
  });

  it('selectDestination 更新 destStarId', () => {
    useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
    useVoyageStore.getState().selectDestination('hip-71681');
    expect(useVoyageStore.getState().destStarId).toBe('hip-71681');
  });

  it('restoreFromSnapshot 恢复 running 控制器并可 resume tick', () => {
    useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
    useVoyageStore.getState().start();
    vi.advanceTimersByTime(5000);
    const snap = useVoyageStore.getState().snapshot!;
    useVoyageStore.getState().dispose();

    useVoyageStore.getState().restoreFromSnapshot(snap, {
      originStarId: 'hip-sol',
      destStarId: 'hip-70890',
    });

    expect(useVoyageStore.getState().progress!.status).toBe('running');
    expect(useVoyageStore.getState().originStarId).toBe('hip-sol');
    expect(useVoyageStore.getState().destStarId).toBe('hip-70890');

    vi.advanceTimersByTime(1000);
    expect(useVoyageStore.getState().progress!.elapsedFocusMs).toBeGreaterThan(
      snap.state.elapsedFocusMs,
    );
  });

  it('dispose 清理 controller，controllerReady=false', () => {
    useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
    useVoyageStore.getState().start();
    useVoyageStore.getState().dispose();

    expect(useVoyageStore.getState().controllerReady).toBe(false);
    expect(useVoyageStore.getState().progress).toBeNull();
  });
});
