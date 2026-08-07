export type VoyagePhase = 'launching' | 'cruising' | 'arriving' | 'braking' | null;

export const LAUNCH_DURATION_MS = 3000;
export const ARRIVE_DURATION_MS = 3000;
export const BRAKE_DURATION_MS = 3000;

export function phaseDurationMs(phase: VoyagePhase): number {
  switch (phase) {
    case 'launching':
      return LAUNCH_DURATION_MS;
    case 'arriving':
      return ARRIVE_DURATION_MS;
    case 'braking':
      return BRAKE_DURATION_MS;
    default:
      return 0;
  }
}

export function transitionProgress(phase: VoyagePhase, elapsedMs: number): number {
  const duration = phaseDurationMs(phase);
  if (duration <= 0) return 0;
  return Math.min(1, Math.max(0, elapsedMs / duration));
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

export function flowIntensity(phase: VoyagePhase, elapsedMs: number): number {
  const t = transitionProgress(phase, elapsedMs);
  if (phase === 'launching') return easeInCubic(t);
  if (phase === 'braking') return 1 - easeOutCubic(t);
  return 0;
}

export function nextPhaseAfterDuration(phase: VoyagePhase): VoyagePhase {
  switch (phase) {
    case 'launching':
      return 'cruising';
    case 'arriving':
      return null;
    case 'braking':
      return null;
    default:
      return phase;
  }
}
