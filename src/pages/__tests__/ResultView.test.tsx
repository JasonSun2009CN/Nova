import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResultView } from '@/pages/ResultView';
import {
  resetStoreDepsForTest,
  resetVoyageControllerForTest,
  useHistoryStore,
  useVoyageStore,
} from '@/store/index';

function completeVoyage() {
  useVoyageStore.getState().prepare({
    focusMinutes: 25,
    vOverC: 0.99,
    originStarId: 'hip-sol',
    destStarId: 'hip-70890',
  });
  useVoyageStore.getState().start();
  useVoyageStore.getState().complete();
}

function resetStores() {
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
  useHistoryStore.setState({
    records: [],
    stats: null,
    loading: false,
    error: null,
  });
  resetStoreDepsForTest();
}

describe('ResultView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    act(() => {
      resetStores();
      resetVoyageControllerForTest();
    });
    vi.useRealTimers();
  });

  it('completed 显示航行完成摘要与目的地', () => {
    completeVoyage();
    render(<ResultView />);
    expect(screen.getByTestId('result-view')).toBeInTheDocument();
    expect(screen.getByText('本次航行完成')).toBeInTheDocument();
    expect(screen.getByText(/比邻星/)).toBeInTheDocument();
  });

  it('再来一次 → 再次进入 running', () => {
    completeVoyage();
    render(<ResultView />);
    fireEvent.click(screen.getByRole('button', { name: '再来一次' }));
    expect(useVoyageStore.getState().progress?.status).toBe('running');
  });

  it('完成航行后「再来一次」→ 从上次目的地出发（出发地 = 上次目的地）', () => {
    completeVoyage();
    render(<ResultView />);
    fireEvent.click(screen.getByRole('button', { name: '再来一次' }));
    expect(useVoyageStore.getState().progress?.status).toBe('running');
    expect(useVoyageStore.getState().originStarId).toBe('hip-70890');
  });

  it('中止航行后「再来一次」→ 从本次出发地出发（位置未变）', () => {
    useVoyageStore.getState().prepare({
      focusMinutes: 25,
      vOverC: 0.99,
      originStarId: 'hip-70890',
      destStarId: 'hip-91262',
    });
    useVoyageStore.getState().start();
    useVoyageStore.getState().abort();
    render(<ResultView />);
    fireEvent.click(screen.getByRole('button', { name: '再来一次' }));
    expect(useVoyageStore.getState().progress?.status).toBe('running');
    expect(useVoyageStore.getState().originStarId).toBe('hip-70890');
  });

  it('回到首页 → progress 清空回 idle', () => {
    completeVoyage();
    render(<ResultView />);
    fireEvent.click(screen.getByRole('button', { name: '回到首页' }));
    expect(useVoyageStore.getState().progress).toBeNull();
  });
});
