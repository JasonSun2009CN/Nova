import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StarInfoCard } from '@/components/StarMap/StarInfoCard';
import { protoToStar, type ProtoStar } from '@/engine/data/star-mapper';
import { DEFAULT_SETTINGS } from '@/storage/SettingsRepository';
import { resetVoyageControllerForTest, useSettingsStore, useVoyageStore } from '@/store/index';

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
}

describe('StarInfoCard', () => {
  afterEach(() => {
    act(() => {
      resetStores();
      resetVoyageControllerForTest();
    });
  });

  it('显示星名、距离与预计专注时长', () => {
    render(<StarInfoCard star={protoToStar(ROSS_154)} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.getByText(/Ross 154/)).toBeInTheDocument();
    expect(screen.getByText(/9.70 ly/)).toBeInTheDocument();
    expect(screen.getByText(/预计专注时长/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '设为目的地' })).toBeInTheDocument();
  });

  it('已设为目的地时显示完成按钮', () => {
    useVoyageStore.setState({ destStarId: 'hip-92403' });
    render(<StarInfoCard star={protoToStar(ROSS_154)} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.getByText('已设为目的地')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
  });

  it('无名字的星不可设目的地且不显示预计时长', () => {
    render(
      <StarInfoCard
        star={protoToStar({ ...ROSS_154, properName: undefined })}
        onClose={() => {}}
        onComplete={() => {}}
      />,
    );
    expect(screen.queryByText(/预计专注时长/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '设为目的地' })).not.toBeInTheDocument();
  });
});
