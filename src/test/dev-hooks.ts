import { fastForwardVoyageForTest } from '@/store/useVoyageStore';
import { getStarScreenPosition, setStarMapAutoRotate } from '@/test/star-map-hooks';

type DevHooks = {
  fastForward: (ms: number) => void;
  getStarScreenPosition: (starId: string) => { clientX: number; clientY: number } | null;
  setAutoRotate: (enabled: boolean) => void;
};

export function installDevHooks(): void {
  if (typeof window === 'undefined') return;
  window.__TEST_ONLY__ = {
    fastForward: (ms) => fastForwardVoyageForTest(ms),
    getStarScreenPosition: (starId) => getStarScreenPosition(starId),
    setAutoRotate: (enabled) => setStarMapAutoRotate(enabled),
  };
}

export type { DevHooks };
