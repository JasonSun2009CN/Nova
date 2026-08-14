import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CaptainLogPanel } from '@/components/CaptainLog/CaptainLogPanel';
import type { VoyageRecord } from '@/contract/storage-types';
import type { VoyageSnapshot, VoyageStatus } from '@/engine/contract/voyage-types';
import { LogView } from '@/pages/LogView';
import { useHistoryStore } from '@/store/useHistoryStore';

const MS_PER_MINUTE = 60_000;

function localToday(hour: number): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0).getTime();
}

function localYesterday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0, 0, 0).getTime();
}

function makeSnapshot(input: {
  status: VoyageStatus;
  startWallTime: number;
  elapsedFocusMs: number;
  traveledLy: number;
}): VoyageSnapshot {
  return {
    version: 1,
    createdAt: input.startWallTime,
    opts: {
      vOverC: 0.99,
      tickIntervalMs: 250,
      infinite: false,
      focusTotalMs: input.elapsedFocusMs,
    },
    state: {
      status: input.status,
      elapsedFocusMs: input.elapsedFocusMs,
      traveledLy: input.traveledLy,
      startWallTime: input.startWallTime,
      lastTickWallTime: input.startWallTime + input.elapsedFocusMs,
      pausedSegments: [],
      currentPauseStart: null,
    },
  };
}

function makeRecord(overrides: Partial<VoyageRecord>): VoyageRecord {
  const startWallTime = overrides.startWallTime ?? localToday(9);
  const elapsedFocusMs = overrides.elapsedFocusMs ?? 25 * MS_PER_MINUTE;
  const status = overrides.status ?? 'completed';
  const base: VoyageRecord = {
    id: `voy-${Math.random()}`,
    status,
    vOverC: 0.99,
    gamma: 7,
    focusTotalMs: elapsedFocusMs,
    elapsedFocusMs,
    traveledLy: 4.246,
    startWallTime,
    endWallTime: startWallTime + elapsedFocusMs,
    originStarId: 'hip-sol',
    originCoords: null,
    destStarId: 'hip-70890',
    destCoords: null,
    snapshot: makeSnapshot({ status, startWallTime, elapsedFocusMs, traveledLy: 4.246 }),
    starsVisitedIds: [],
    createdAt: startWallTime,
    updatedAt: startWallTime + elapsedFocusMs,
  };
  return { ...base, ...overrides };
}

function seedRecords(records: readonly VoyageRecord[]) {
  act(() => {
    useHistoryStore.setState({
      records: [...records],
      stats: null,
      loading: false,
      error: null,
    });
  });
}

afterEach(() => {
  act(() => {
    useHistoryStore.setState({ records: [], stats: null, loading: false, error: null });
  });
});

describe('CaptainLogPanel', () => {
  it('渲染总览：专注时长 / 距离 / 已探索恒星（完成去重）/ streak', () => {
    seedRecords([
      makeRecord({ startWallTime: localToday(9) }),
      makeRecord({ startWallTime: localToday(10), elapsedFocusMs: 25 * MS_PER_MINUTE }),
      makeRecord({
        startWallTime: localYesterday(),
        status: 'aborted',
        elapsedFocusMs: 10 * MS_PER_MINUTE,
        destStarId: 'hip-91262',
      }),
    ]);

    render(<CaptainLogPanel />);

    expect(screen.getByText('总专注时长')).toBeInTheDocument();
    expect(screen.getByText('1 小时')).toBeInTheDocument();
    expect(screen.getByText('已探索恒星')).toBeInTheDocument();
    expect(screen.getByText('1 颗')).toBeInTheDocument();
    expect(screen.getByText('完成航行')).toBeInTheDocument();
    expect(screen.getByText('2 次')).toBeInTheDocument();
    expect(screen.getByText('2 天')).toBeInTheDocument();
    expect(screen.getAllByText(/比邻星/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('完成').length).toBeGreaterThan(0);
    expect(screen.getByText('中止')).toBeInTheDocument();
  });

  it('无记录时渲染空态，不渲染热力图', () => {
    seedRecords([]);
    render(<CaptainLogPanel />);
    expect(screen.getByText('还没有航行记录，开启第一次专注吧。')).toBeInTheDocument();
    expect(screen.queryByText('专注热力图 · 近 26 周')).not.toBeInTheDocument();
  });
});

describe('LogView（航行日志全屏视图）', () => {
  it('渲染标题、统计面板与航行列表', async () => {
    seedRecords([makeRecord({ startWallTime: localToday(9) })]);
    await act(async () => {
      render(<LogView onBack={() => {}} />);
    });
    expect(screen.getByTestId('log-view')).toBeInTheDocument();
    expect(screen.getByText('航行日志')).toBeInTheDocument();
    expect(screen.getByText('总专注时长')).toBeInTheDocument();
    expect(screen.getByTestId('history-panel')).toBeInTheDocument();
  });

  it('点击返回按钮触发 onBack', async () => {
    seedRecords([]);
    const onBack = vi.fn();
    await act(async () => {
      render(<LogView onBack={onBack} />);
    });
    fireEvent.click(screen.getByRole('button', { name: '关闭船长日志' }));
    expect(onBack).toHaveBeenCalled();
  });
});
