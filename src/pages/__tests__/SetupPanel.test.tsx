import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { cruisePlan } from '@/engine';
import { protoToStar, type ProtoStar } from '@/engine/data/star-mapper';
import { SetupPanel } from '@/pages/SetupPanel';
import { DEFAULT_SETTINGS } from '@/storage/SettingsRepository';
import {
  resetStoreDepsForTest,
  resetVoyageControllerForTest,
  useCatalogStore,
  useSettingsStore,
  useVoyageStore,
} from '@/store/index';

const ROSS_154: ProtoStar = {
  id: 'hip-92403',
  properName: 'Ross 154',
  raDeg: 210.5,
  decDeg: -23.4,
  distanceLy: 9.7,
  vMag: 10.4,
  absMag: 13.07,
  spectral: 'M3.5V',
  tier: 'tier1-nearby-100ly',
};

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
  useSettingsStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    hydrated: false,
    loading: false,
    error: null,
  });
  useCatalogStore.getState().reset();
  resetStoreDepsForTest();
}

describe('SetupPanel', () => {
  afterEach(() => {
    act(() => {
      resetStores();
      resetVoyageControllerForTest();
    });
  });

  it('渲染时长滑动条、目的地选择与启动按钮', () => {
    render(<SetupPanel />);
    expect(screen.getByLabelText('专注时长滑动条')).toBeInTheDocument();
    expect(screen.getByLabelText('自定义专注时长（分钟）')).toBeInTheDocument();
    expect(screen.getByLabelText('目的地')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '启动航行' })).toBeInTheDocument();
  });

  it('点击启动航行 → progress=running 且从太阳系出发', () => {
    render(<SetupPanel />);
    fireEvent.click(screen.getByRole('button', { name: '启动航行' }));
    expect(useVoyageStore.getState().progress?.status).toBe('running');
    expect(useVoyageStore.getState().originStarId).toBe('hip-sol');
  });

  it('选择目的地 → destStarId 更新', () => {
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-70890' } });
    expect(useVoyageStore.getState().destStarId).toBe('hip-70890');
  });

  it('输入 15 分钟并启动 → focusTotalMs=15 分钟', () => {
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('自定义专注时长（分钟）'), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByRole('button', { name: '启动航行' }));
    expect(useVoyageStore.getState().progress?.focusTotalMs).toBe(15 * 60_000);
  });

  it('目录星（不在 DESTINATION_STARS）设为目的地后正确显示（修复 bug）', () => {
    useCatalogStore.setState({
      stars: [protoToStar(ROSS_154)],
      status: 'ready',
      source: 'cache',
      error: null,
    });
    render(<SetupPanel />);
    expect(screen.getByRole('option', { name: /Ross 154/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-92403' } });
    expect(useVoyageStore.getState().destStarId).toBe('hip-92403');
    expect(screen.getByText(/太阳系 → Ross 154/)).toBeInTheDocument();
  });

  it('选中目的地后由专注时长推算航行速度（巡航速度+γ+地球历时）', () => {
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-70890' } });
    const plan = cruisePlan({ focusMinutes: 25, distanceLy: 4.246 });
    expect(screen.getByText('航行速度（推算）')).toBeInTheDocument();
    expect(screen.getByText(/船上 25分钟 ≈ 地球上 4.2 年/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '启动航行' }));
    expect(useVoyageStore.getState().progress?.vOverC).toBe(plan.vOverC);
    const gamma = useVoyageStore.getState().progress?.gamma;
    expect(gamma).toBeDefined();
    expect((gamma ?? 0) / plan.gamma).toBeCloseTo(1, 3);
  });
});
