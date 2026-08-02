import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VoyageSnapshot } from '@/engine/contract/voyage-types';
import { clearLiveVoyage, loadLiveVoyage, saveLiveVoyage } from '@/storage/live-voyage-storage';

function sampleSnapshot(status: 'running' | 'paused' | 'completed'): VoyageSnapshot {
  return {
    version: 1,
    createdAt: 1_700_000_000_000,
    opts: {
      vOverC: 0.99,
      tickIntervalMs: 250,
      infinite: false,
      focusTotalMs: 25 * 60 * 1000,
    },
    state: {
      status,
      elapsedFocusMs: 120_000,
      traveledLy: 0.01,
      startWallTime: 1_700_000_000_000,
      lastTickWallTime: 1_700_002_000_000,
      pausedSegments: [],
      currentPauseStart: null,
    },
  };
}

describe('live-voyage-storage (localStorage)', () => {
  beforeEach(() => clearLiveVoyage());
  afterEach(() => {
    clearLiveVoyage();
    vi.unstubAllGlobals();
  });

  it('save → load 返回完整 meta', () => {
    saveLiveVoyage({
      snapshot: sampleSnapshot('running'),
      originStarId: 'hip-sol',
      destStarId: 'hip-70890',
      savedAt: 1_700_000_000_000,
    });

    const loaded = loadLiveVoyage();
    expect(loaded).not.toBeNull();
    expect(loaded!.snapshot.state.status).toBe('running');
    expect(loaded!.originStarId).toBe('hip-sol');
    expect(loaded!.destStarId).toBe('hip-70890');
  });

  it('completed 的航行不返回（仅 running/paused）', () => {
    saveLiveVoyage({
      snapshot: sampleSnapshot('completed'),
      originStarId: null,
      destStarId: null,
      savedAt: 1,
    });
    expect(loadLiveVoyage()).toBeNull();
  });

  it('clear 后返回 null', () => {
    saveLiveVoyage({
      snapshot: sampleSnapshot('paused'),
      originStarId: null,
      destStarId: null,
      savedAt: 1,
    });
    clearLiveVoyage();
    expect(loadLiveVoyage()).toBeNull();
  });

  it('坏 JSON → null', () => {
    localStorage.setItem('nova:live-voyage', '{invalid json');
    expect(loadLiveVoyage()).toBeNull();
  });

  it('结构不对 → null', () => {
    localStorage.setItem('nova:live-voyage', JSON.stringify({ foo: 1 }));
    expect(loadLiveVoyage()).toBeNull();
  });

  it('localStorage 不可用时安全返回 null / 不抛错', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadLiveVoyage()).toBeNull();
    expect(() =>
      saveLiveVoyage({
        snapshot: sampleSnapshot('running'),
        originStarId: null,
        destStarId: null,
        savedAt: 1,
      }),
    ).not.toThrow();
    expect(() => clearLiveVoyage()).not.toThrow();
  });
});
