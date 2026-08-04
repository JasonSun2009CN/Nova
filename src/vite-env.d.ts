/// <reference types="vite/client" />

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __TEST_ONLY__?: {
      fastForward: (ms: number) => void;
      getStarScreenPosition: (starId: string) => { clientX: number; clientY: number } | null;
      setAutoRotate: (enabled: boolean) => void;
    };
  }
}

export {};
