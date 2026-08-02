export type VoyageStatus = 'idle' | 'running' | 'paused' | 'completed' | 'aborted';

export type VoyageAbortReason = 'user' | 'system' | 'timeout';

export type VoyageProgress = Readonly<{
  status: VoyageStatus;
  focusTotalMs: number | null;
  elapsedFocusMs: number;
  remainingFocusMs: number | null;
  vOverC: number;
  gamma: number;
  traveledLy: number;
  startWallTime: number | null;
  lastUpdateWallTime: number | null;
  pausedSegments: readonly { start: number; end: number }[];
}>;

export type VoyageSnapshot = {
  version: 1;
  createdAt: number;
  opts: Required<Pick<VoyageOptions, 'vOverC' | 'tickIntervalMs' | 'infinite'>> & {
    focusTotalMs: number | null;
  };
  state: {
    status: VoyageStatus;
    elapsedFocusMs: number;
    traveledLy: number;
    startWallTime: number | null;
    lastTickWallTime: number | null;
    pausedSegments: { start: number; end: number }[];
    currentPauseStart: number | null;
  };
};

export type VoyageOptions = {
  focusMinutes?: number;
  focusHours?: number;
  vOverC: number;
  infinite?: boolean;
  tickIntervalMs?: number;
  abortSignal?: AbortSignal;
};

export type VoyageEventMap = {
  progress: [progress: VoyageProgress];
  complete: [progress: VoyageProgress];
  abort: [progress: VoyageProgress & { reason: VoyageAbortReason }];
  pause: [progress: VoyageProgress];
  resume: [progress: VoyageProgress];
};
