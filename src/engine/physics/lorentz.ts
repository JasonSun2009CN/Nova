export const LIGHT_SPEED = 299_792_458;
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
const METERS_PER_LIGHT_YEAR = LIGHT_SPEED * SECONDS_PER_YEAR;

export function lorentzFactor(v: number): number {
  if (!Number.isFinite(v) || v < 0) {
    throw new RangeError('lorentzFactor: v 必须是非负有限数值（单位 m/s）');
  }
  if (v >= LIGHT_SPEED) {
    throw new RangeError(`lorentzFactor: v (${v}) >= c (${LIGHT_SPEED})，违反相对论约束。`);
  }

  const beta = v / LIGHT_SPEED;
  if (beta < 1e-6) {
    return 1 + (beta * beta) / 2 + (3 * beta ** 4) / 8;
  }
  if (beta > 0.999_999) {
    const epsilon = 1 - beta;
    return 1 / Math.sqrt(2 * epsilon);
  }
  return 1 / Math.sqrt(1 - beta * beta);
}

export type TravelDistanceInput = {
  vOverC: number;
} & (
  | { focusMinutes: number; focusHours?: never }
  | { focusHours: number; focusMinutes?: never }
  | { focusMinutes: number; focusHours: number }
);

export function travelDistance(input: TravelDistanceInput): number {
  const { vOverC } = input;
  if (!(vOverC > 0 && vOverC < 1)) {
    throw new RangeError('travelDistance: vOverC 必须在 (0, 1) 区间内。');
  }
  let hours = 0;
  if ('focusMinutes' in input && typeof input.focusMinutes === 'number') {
    hours += input.focusMinutes / 60;
  }
  if ('focusHours' in input && typeof input.focusHours === 'number') {
    hours += input.focusHours;
  }
  if (!(hours > 0)) {
    throw new TypeError('travelDistance: 必须提供正数 focusMinutes 或 focusHours。');
  }
  const v = LIGHT_SPEED * vOverC;
  const gamma = lorentzFactor(v);
  const subjectiveSeconds = hours * 3600;
  const properSeconds = subjectiveSeconds * gamma;
  const meters = v * properSeconds;
  return meters / METERS_PER_LIGHT_YEAR;
}

export const __internal = {
  SECONDS_PER_YEAR,
  METERS_PER_LIGHT_YEAR,
};
