import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HistoryPanel } from '@/components/HistoryPanel';
import type { VoyageSnapshot } from '@/engine/contract/voyage-types';
import { NovaDatabase } from '@/storage/NovaDatabase';
import { SettingsRepository } from '@/storage/SettingsRepository';
import { VoyageRepository } from '@/storage/VoyageRepository';
import { resetStoreDepsForTest, setStoreDepsForTest, useHistoryStore } from '@/store/index';

function sampleSnapshot(status: 'completed' | 'aborted'): VoyageSnapshot {
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
      elapsedFocusMs: 25 * 60 * 1000,
      traveledLy: 0.02,
      startWallTime: 1_700_000_000_000,
      lastTickWallTime: 1_700_001_500_000,
      pausedSegments: [],
      currentPauseStart: null,
    },
  };
}

describe('HistoryPanel', () => {
  afterEach(() => {
    act(() => {
      useHistoryStore.setState({
        records: [],
        stats: null,
        loading: false,
        error: null,
      });
      resetStoreDepsForTest();
    });
  });

  it('渲染历史记录与统计', async () => {
    await NovaDatabase.temp('nova-hist-ui-1', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({ db, voyageRepo, settingsRepo: new SettingsRepository(db) });
      await voyageRepo.save({
        snapshot: sampleSnapshot('completed'),
        originStar: { id: 'hip-sol' },
        destStar: { id: 'hip-70890' },
      });

      render(<HistoryPanel />);

      expect(await screen.findByText('完成')).toBeInTheDocument();
      expect(screen.getByText(/比邻星/)).toBeInTheDocument();
    });
  });

  it('删除记录后显示空态', async () => {
    await NovaDatabase.temp('nova-hist-ui-2', async (db) => {
      const voyageRepo = new VoyageRepository(db);
      setStoreDepsForTest({ db, voyageRepo, settingsRepo: new SettingsRepository(db) });
      await voyageRepo.save({
        snapshot: sampleSnapshot('completed'),
        originStar: { id: 'hip-sol' },
      });

      render(<HistoryPanel />);
      await screen.findByText('完成');

      fireEvent.click(screen.getByRole('button', { name: '删除这条记录' }));
      expect(await screen.findByText('还没有航行记录，开启第一次专注吧。')).toBeInTheDocument();
    });
  });
});
