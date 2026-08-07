import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { distanceBetweenStars } from '@/data/destination-stars';
import { cruisePlan } from '@/engine';
import { protoToStar, type ProtoStar } from '@/engine/data/star-mapper';
import { SetupPanel } from '@/pages/SetupPanel';
import { DEFAULT_SETTINGS } from '@/storage/SettingsRepository';
import { formatLy } from '@/utils/format';
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

const PROXIMA: ProtoStar = {
  id: 'hip-70890',
  properName: '比邻星',
  raDeg: 217.4,
  decDeg: -62.68,
  distanceLy: 4.246,
  vMag: 11.05,
  absMag: 15.6,
  spectral: 'M5.5V',
  tier: 'tier1-nearby-100ly',
};

const VEGA: ProtoStar = {
  id: 'hip-91262',
  properName: '织女星',
  raDeg: 279.23,
  decDeg: 38.78,
  distanceLy: 25.04,
  vMag: 0.03,
  absMag: 0.58,
  spectral: 'A0V',
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

  it('未选目的地时显示推荐目的地（默认 25 分钟 → 最远可达的半人马座 α A）且点选用即选中', () => {
    render(<SetupPanel />);
    const recommend = screen.getByTestId('recommend-destination');
    expect(recommend).toBeInTheDocument();
    expect(recommend).toHaveTextContent('推荐目的地');
    expect(recommend).toHaveTextContent('半人马座 α A');
    fireEvent.click(screen.getByRole('button', { name: '选用' }));
    expect(useVoyageStore.getState().destStarId).toBe('hip-71683');
  });

  it('选中目的地后不再显示推荐', () => {
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-70890' } });
    expect(screen.queryByText(/推荐目的地/)).not.toBeInTheDocument();
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

  it('出发地 = settings.currentStarId（上次目的地）：从比邻星出发并显示', () => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, currentStarId: 'hip-70890' },
      hydrated: true,
      loading: false,
      error: null,
    });
    render(<SetupPanel />);
    expect(screen.getByText(/飞船将从 比邻星/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '启动航行' }));
    expect(useVoyageStore.getState().originStarId).toBe('hip-70890');
  });

  it('从非太阳系出发：预计专注按两星 leg 距离反推而非目的星太阳距', () => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, currentStarId: 'hip-70890' },
      hydrated: true,
      loading: false,
      error: null,
    });
    useCatalogStore.setState({
      stars: [protoToStar(PROXIMA), protoToStar(VEGA)],
      status: 'ready',
      source: 'cache',
      error: null,
    });
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('自定义专注时长（分钟）'), {
      target: { value: '300' },
    });
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-91262' } });
    expect(screen.getByText(/比邻星 → 织女星/)).toBeInTheDocument();
    const legLy = distanceBetweenStars(protoToStar(PROXIMA), protoToStar(VEGA));
    const sunLy = 25.04;
    expect(legLy).not.toBeCloseTo(sunLy, 1);
    const plan = cruisePlan({ focusMinutes: 300, distanceLy: legLy });
    const sunPlan = cruisePlan({ focusMinutes: 300, distanceLy: sunLy });
    expect(screen.getByText('航行速度（推算）')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '启动航行' }));
    const started = useVoyageStore.getState().progress;
    const startedGamma = started?.gamma ?? 0;
    expect(startedGamma / plan.gamma).toBeCloseTo(1, 3);
    expect(startedGamma).not.toBeCloseTo(sunPlan.gamma, 1);
  });

  it('选择目的地后显示航行距离 + 两地距太阳（太阳系出发）', () => {
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-70890' } });
    expect(screen.getByText(/太阳系 → 比邻星/)).toBeInTheDocument();
    expect(screen.getByText(/出发地距太阳 0\.000 ly/)).toBeInTheDocument();
    expect(screen.getByText(/目的地距太阳 4\.25 ly/)).toBeInTheDocument();
    expect(screen.getByText(/航行距离 4\.25 ly/)).toBeInTheDocument();
  });

  it('从非太阳系出发：显示出发地/目的地距太阳 + 航行距离（leg）', () => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, currentStarId: 'hip-70890' },
      hydrated: true,
      loading: false,
      error: null,
    });
    useCatalogStore.setState({
      stars: [protoToStar(PROXIMA), protoToStar(VEGA)],
      status: 'ready',
      source: 'cache',
      error: null,
    });
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-91262' } });
    const legLy = distanceBetweenStars(protoToStar(PROXIMA), protoToStar(VEGA));
    expect(screen.getByText(/比邻星 → 织女星/)).toBeInTheDocument();
    expect(screen.getByText(/出发地距太阳 4\.25 ly/)).toBeInTheDocument();
    expect(screen.getByText(/目的地距太阳 25\.04 ly/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`航行距离 ${formatLy(legLy)}`))).toBeInTheDocument();
  });

  it('非太阳出发但星表未加载：出发地距太阳回退硬编码表而非 0', () => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, currentStarId: 'hip-70890' },
      hydrated: true,
      loading: false,
      error: null,
    });
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-91262' } });
    expect(screen.getByText(/比邻星 Proxima Centauri → 织女一/)).toBeInTheDocument();
    expect(screen.getByText(/出发地距太阳 4\.25 ly/)).toBeInTheDocument();
    expect(screen.getByText(/目的地距太阳 25\.04 ly/)).toBeInTheDocument();
  });

  it('25 分钟选织女星不可达（需 γ 超常规引擎上限）→ 显示不可达提示并禁用启动', () => {
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-91262' } });
    const warning = screen.getByTestId('unreachable-warning');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent(/无法在 25分钟 内抵达/);
    expect(warning).toHaveTextContent(/需 γ ×/);
    expect(warning).toHaveTextContent(/解锁 曲速二级/);
    expect(warning).toHaveTextContent(/当前引擎最短专注/);
    expect(screen.getByRole('button', { name: '启动航行' })).toBeDisabled();
  });

  it('拉长专注时长至可达 → 不可达提示消失、可启动', () => {
    render(<SetupPanel />);
    fireEvent.change(screen.getByLabelText('自定义专注时长（分钟）'), {
      target: { value: '150' },
    });
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: 'hip-91262' } });
    expect(screen.queryByTestId('unreachable-warning')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '启动航行' })).toBeEnabled();
  });
});
