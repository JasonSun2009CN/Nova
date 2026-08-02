/// <reference types="vite/client" />

type Window = {
  __TEST_ONLY__?: {
    fastForward: (ms: number) => void;
  };
};
