/// <reference types="vite/client" />

declare global {
  const __APP_VERSION__: string;
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __TEST_ONLY__?: {
      fastForward: (ms: number) => void;
      setHistoryStatsForTest: (totalFocusHours: number) => void;
      getStarScreenPosition: (starId: string) => { clientX: number; clientY: number } | null;
      setAutoRotate: (enabled: boolean) => void;
      getViewMode: () => 'from-departure' | 'overview' | null;
      getCameraPosition: () => { x: number; y: number; z: number } | null;
    };
  }
}

export {};
