import { fastForwardVoyageForTest } from '@/store/useVoyageStore';

type DevHooks = {
  fastForward: (ms: number) => void;
};

export function installDevHooks(): void {
  if (typeof window === 'undefined') return;
  window.__TEST_ONLY__ = {
    fastForward: (ms) => fastForwardVoyageForTest(ms),
  };
}

export type { DevHooks };
