import { fastForwardVoyageForTest } from '@/store/useVoyageStore';
import {
  getStarMapCameraPosition,
  getStarMapViewMode,
  getStarScreenPosition,
  setStarMapAutoRotate,
} from '@/test/star-map-hooks';
import { useHistoryStore } from '@/store/useHistoryStore';
import type { StarMapViewMode } from '@/engine/renderer/StarMapCameraRig';

type DevHooks = {
  fastForward: (ms: number) => void;
  setHistoryStatsForTest: (totalFocusHours: number) => void;
  getStarScreenPosition: (starId: string) => { clientX: number; clientY: number } | null;
  setAutoRotate: (enabled: boolean) => void;
  getViewMode: () => StarMapViewMode | null;
  getCameraPosition: () => { x: number; y: number; z: number } | null;
};

export function installDevHooks(): void {
  if (typeof window === 'undefined') return;
  window.__TEST_ONLY__ = {
    fastForward: (ms) => fastForwardVoyageForTest(ms),
    setHistoryStatsForTest: (totalFocusHours) =>
      useHistoryStore.setState({
        stats: { total: 1, totalFocusHours, totalTraveledLy: 0, completedVoyages: 1 },
      }),
    getStarScreenPosition: (starId) => getStarScreenPosition(starId),
    setAutoRotate: (enabled) => setStarMapAutoRotate(enabled),
    getViewMode: () => getStarMapViewMode(),
    getCameraPosition: () => getStarMapCameraPosition(),
  };
}

export type { DevHooks };
