/// <reference types="vite/client" />

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __TEST_ONLY__?: {
      fastForward: (ms: number) => void;
    };
  }
}

export {};
