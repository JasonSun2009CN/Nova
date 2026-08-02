import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VoyageSnapshot } from '@/engine/contract/voyage-types';
import { clearLiveVoyage, loadLiveVoyage, saveLiveVoyage } from '@/storage/live-voyage-storage';
import {
  resetStoreDepsForTest,
  resetVoyageControllerForTest,
  useHistoryStore,
  useVoyageStore,
} from '@/store/index';

class FakeWorker {
  static instances: FakeWorker[] = [];
  messages: unknown[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  terminated = false;

  constructor(
    public url: string | URL,
    public options?: unknown,
  ) {
    FakeWorker.instances.push(this);
  }

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emitTick(ts: number): void {
    this.onmessage?.({ data: { type: 'tick', ts } });
  }
}

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
    resumedFromSnapshot: false,
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

function sampleSnapshot(status: 'running' | 'paused', elapsedMs = 60_000): VoyageSnapshot {
  const createdAt = 1_700_000_000_000;
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
      elapsedFocusMs: elapsedMs,
      traveledLy: 0.001,
      startWallTime: createdAt,
      lastTickWallTime: createdAt + elapsedMs,
      pausedSegments: [],
      currentPauseStart: status === 'paused' ? createdAt + elapsedMs : null,
    },
  };
}

describe('useVoyageStore · worker 驱动 + 崩溃恢复 (S13)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(Date.UTC(2025, 0, 1, 12, 0, 0));
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
    resetVoyageStore();
    resetHistoryStore();
    resetStoreDepsForTest();
    clearLiveVoyage();
  });

  afterEach(() => {
    resetVoyageControllerForTest();
    resetVoyageStore();
    resetHistoryStore();
    resetStoreDepsForTest();
    clearLiveVoyage();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('prepare → start 创建 worker，tick 事件驱动 progress 前进', () => {
    useVoyageStore.getState().prepare({
      focusMinutes: 25,
      vOverC: 0.99,
      originStarId: 'hip-sol',
      destStarId: 'hip-70890',
    });
    useVoyageStore.getState().start();

    expect(FakeWorker.instances).toHaveLength(1);
    const worker = FakeWorker.instances[0]!;
    expect(worker.messages).toContainEqual({ type: 'start', intervalMs: 250 });

    const start = Date.now();
    worker.emitTick(start + 3000);
    expect(useVoyageStore.getState().progress!.status).toBe('running');
    expect(useVoyageStore.getState().progress!.elapsedFocusMs).toBe(3000);
  });

  it('pause 停止 worker，resume 重新创建', () => {
    useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
    useVoyageStore.getState().start();
    const worker = FakeWorker.instances[0]!;

    useVoyageStore.getState().pause();
    expect(worker.messages).toContainEqual({ type: 'stop' });
    expect(worker.terminated).toBe(true);

    useVoyageStore.getState().resume();
    expect(FakeWorker.instances).toHaveLength(2);
    expect(FakeWorker.instances[1]!.messages).toContainEqual({ type: 'start', intervalMs: 250 });
  });

  it('progress 时写入 live voyage，complete 后清除', async () => {
    useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
    useVoyageStore.getState().start();
    const worker = FakeWorker.instances[0]!;
    const start = Date.now();

    vi.setSystemTime(start + 2000);
    worker.emitTick(start + 2000);
    const live = loadLiveVoyage();
    expect(live).not.toBeNull();
    expect(live!.snapshot.state.status).toBe('running');
    expect(live!.snapshot.state.elapsedFocusMs).toBe(2000);

    vi.setSystemTime(start + 30 * 60 * 1000);
    worker.emitTick(start + 30 * 60 * 1000);
    expect(useVoyageStore.getState().progress!.status).toBe('completed');
    expect(loadLiveVoyage()).toBeNull();
    await flushAsync();
  });

  it('abort 停止 worker 并清除 live voyage', async () => {
    saveLiveVoyage({
      snapshot: sampleSnapshot('running'),
      originStarId: 'hip-sol',
      destStarId: null,
      savedAt: Date.now(),
    });

    useVoyageStore.getState().prepare({ focusMinutes: 25, vOverC: 0.99 });
    useVoyageStore.getState().start();
    const worker = FakeWorker.instances[0]!;

    useVoyageStore.getState().abort('user');
    expect(useVoyageStore.getState().progress!.status).toBe('aborted');
    expect(worker.terminated).toBe(true);
    expect(loadLiveVoyage()).toBeNull();
    await flushAsync();
  });

  it('resumeFromLiveVoyage 恢复 running 航行并启动 worker', () => {
    saveLiveVoyage({
      snapshot: sampleSnapshot('running'),
      originStarId: 'hip-sol',
      destStarId: 'hip-70890',
      savedAt: Date.now(),
    });

    const ok = useVoyageStore.getState().resumeFromLiveVoyage();

    expect(ok).toBe(true);
    expect(useVoyageStore.getState().controllerReady).toBe(true);
    expect(useVoyageStore.getState().progress!.status).toBe('running');
    expect(useVoyageStore.getState().resumedFromSnapshot).toBe(true);
    expect(useVoyageStore.getState().originStarId).toBe('hip-sol');
    expect(useVoyageStore.getState().destStarId).toBe('hip-70890');
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it('resumeFromLiveVoyage 恢复 paused 航行不启动 worker', () => {
    saveLiveVoyage({
      snapshot: sampleSnapshot('paused'),
      originStarId: null,
      destStarId: null,
      savedAt: Date.now(),
    });

    const ok = useVoyageStore.getState().resumeFromLiveVoyage();

    expect(ok).toBe(true);
    expect(useVoyageStore.getState().progress!.status).toBe('paused');
    expect(FakeWorker.instances).toHaveLength(0);
  });

  it('没有 live voyage 时 resumeFromLiveVoyage 返回 false', () => {
    expect(useVoyageStore.getState().resumeFromLiveVoyage()).toBe(false);
  });
});
