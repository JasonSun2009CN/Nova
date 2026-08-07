import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VoyageView } from '@/pages/VoyageView';
import {
  resetStoreDepsForTest,
  resetVoyageControllerForTest,
  useHistoryStore,
  useVoyageStore,
} from '@/store/index';

vi.mock('@/engine/renderer/VoyageStarField', () => ({
  VoyageStarField: () => null,
}));

function startVoyage() {
  useVoyageStore.getState().prepare({
    focusMinutes: 25,
    vOverC: 0.99,
    originStarId: 'hip-sol',
    destStarId: 'hip-70890',
  });
  useVoyageStore.getState().start();
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

describe('VoyageView', () => {
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

  it('渲染倒计时与目的地', async () => {
    startVoyage();
    await act(async () => {
      render(<VoyageView />);
    });
    expect(screen.getByTestId('voyage-view')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText(/比邻星/)).toBeInTheDocument();
  });

  it('暂停 → paused 显示已暂停，继续 → running', async () => {
    startVoyage();
    await act(async () => {
      render(<VoyageView />);
    });

    fireEvent.click(screen.getByRole('button', { name: '暂停' }));
    expect(useVoyageStore.getState().progress?.status).toBe('paused');
    expect(screen.getByText('已暂停')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    expect(useVoyageStore.getState().progress?.status).toBe('running');
  });

  it('点击结束 → progress.status=aborted', async () => {
    startVoyage();
    await act(async () => {
      render(<VoyageView />);
    });

    fireEvent.click(screen.getByRole('button', { name: '结束' }));
    expect(useVoyageStore.getState().progress?.status).toBe('aborted');
  });

  it('S25 仪表盘：航行进度显示出发地→目的地星名 + 引擎功率/双时间轴', async () => {
    startVoyage();
    await act(async () => {
      render(<VoyageView />);
    });
    const gauge = screen.getByTestId('voyage-progress-gauge');
    expect(gauge).toHaveTextContent('太阳系');
    expect(gauge).toHaveTextContent(/比邻星/);
    expect(screen.getByText('引擎功率')).toBeInTheDocument();
    expect(screen.getByText('航行速度')).toBeInTheDocument();
    expect(screen.getByText(/船上已过/)).toBeInTheDocument();
  });
});
