import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VoyageProgress } from '@/engine/contract/voyage-types';
import { DEFAULT_SETTINGS } from '@/storage/SettingsRepository';
import { resetStoreDepsForTest, useSettingsStore, useVoyageStore } from '@/store/index';
import { sendFocusNotification } from '@/utils/notifications';
import { useFocusNotifications } from '@/components/useFocusNotifications';

vi.mock('@/utils/notifications', () => ({
  sendFocusNotification: vi.fn(),
}));

function runningProgress(): VoyageProgress {
  return {
    status: 'running',
    focusTotalMs: null,
    elapsedFocusMs: 0,
    remainingFocusMs: null,
    vOverC: 0.99,
    gamma: 7,
    traveledLy: 0,
    startWallTime: null,
    lastUpdateWallTime: null,
    pausedSegments: [],
  };
}

function Host() {
  useFocusNotifications();
  return null;
}

describe('useFocusNotifications（S33 浏览器通知触发）', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, browserNotificationsEnabled: true },
      hydrated: true,
      loading: false,
      error: null,
    });
    useVoyageStore.setState({
      progress: null,
      destStarId: null,
      originStarId: null,
    });
    vi.mocked(sendFocusNotification).mockClear();
  });

  afterEach(() => {
    resetStoreDepsForTest();
  });

  it('开启通知：running → completed 触发「完成」通知，带目的星名', () => {
    const progress = runningProgress();
    useVoyageStore.setState({ progress, destStarId: 'hip-70890' });
    render(<Host />);

    act(() => {
      useVoyageStore.setState({
        progress: { ...progress, status: 'completed' },
      });
    });

    expect(sendFocusNotification).toHaveBeenCalledTimes(1);
    expect(sendFocusNotification).toHaveBeenCalledWith('complete', '比邻星 Proxima Centauri', 'zh');
  });

  it('开启通知：running → aborted 触发「中止」通知', () => {
    const progress = runningProgress();
    useVoyageStore.setState({ progress, destStarId: 'hip-91262' });
    render(<Host />);

    act(() => {
      useVoyageStore.setState({ progress: { ...progress, status: 'aborted' } });
    });

    expect(sendFocusNotification).toHaveBeenCalledTimes(1);
    expect(sendFocusNotification).toHaveBeenCalledWith('aborted', '织女一 (天琴座 α Vega)', 'zh');
  });

  it('关闭通知：running → completed 不触发', () => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, browserNotificationsEnabled: false },
      hydrated: true,
      loading: false,
      error: null,
    });
    const progress = runningProgress();
    useVoyageStore.setState({ progress, destStarId: 'hip-70890' });
    render(<Host />);

    act(() => {
      useVoyageStore.setState({ progress: { ...progress, status: 'completed' } });
    });

    expect(sendFocusNotification).not.toHaveBeenCalled();
  });

  it('非 running→completed 的迁移（如暂停→恢复）不触发', () => {
    const running = runningProgress();
    useVoyageStore.setState({ progress: running, destStarId: 'hip-70890' });
    render(<Host />);

    act(() => {
      useVoyageStore.setState({ progress: { ...running, status: 'paused' } });
    });
    act(() => {
      useVoyageStore.setState({ progress: { ...running, status: 'running' } });
    });

    expect(sendFocusNotification).not.toHaveBeenCalled();
  });
});
