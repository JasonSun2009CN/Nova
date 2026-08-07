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

export function requiredFocusMinutes(distanceLy: number, vOverC: number): number {
  if (!(distanceLy > 0)) {
    throw new RangeError('requiredFocusMinutes: distanceLy 必须为正数。');
  }
  if (!(vOverC > 0 && vOverC < 1)) {
    throw new RangeError('requiredFocusMinutes: vOverC 必须在 (0, 1) 区间内。');
  }
  const v = LIGHT_SPEED * vOverC;
  const gamma = lorentzFactor(v);
  const meters = distanceLy * METERS_PER_LIGHT_YEAR;
  return meters / (v * gamma * 60);
}

export type CruisePlanInput = {
  focusMinutes: number;
  distanceLy: number;
};

export type CruisePlan = {
  vOverC: number;
  gamma: number;
  earthYears: number;
};

export function cruisePlan(input: CruisePlanInput): CruisePlan {
  const { focusMinutes, distanceLy } = input;
  if (!(Number.isFinite(focusMinutes) && focusMinutes > 0)) {
    throw new RangeError('cruisePlan: focusMinutes 必须为正数。');
  }
  if (!(Number.isFinite(distanceLy) && distanceLy > 0)) {
    throw new RangeError('cruisePlan: distanceLy 必须为正数。');
  }
  const focusYears = (focusMinutes * 60) / SECONDS_PER_YEAR;
  const rapidity = distanceLy / focusYears;
  const gamma = Math.sqrt(1 + rapidity * rapidity);
  const vOverC = Math.sqrt(1 - 1 / (gamma * gamma));
  return { vOverC, gamma, earthYears: focusYears * gamma };
}

export function requiredGamma(distanceLy: number, focusMinutes: number): number {
  if (!(Number.isFinite(distanceLy) && distanceLy > 0)) {
    throw new RangeError('requiredGamma: distanceLy 必须为正数。');
  }
  if (!(Number.isFinite(focusMinutes) && focusMinutes > 0)) {
    throw new RangeError('requiredGamma: focusMinutes 必须为正数。');
  }
  const focusYears = (focusMinutes * 60) / SECONDS_PER_YEAR;
  const rapidity = distanceLy / focusYears;
  return Math.sqrt(1 + rapidity * rapidity);
}

export function minFocusMinutes(distanceLy: number, gammaMax: number): number {
  if (!(Number.isFinite(distanceLy) && distanceLy > 0)) {
    throw new RangeError('minFocusMinutes: distanceLy 必须为正数。');
  }
  if (!(Number.isFinite(gammaMax) && gammaMax > 1)) {
    throw new RangeError('minFocusMinutes: gammaMax 必须大于 1。');
  }
  const beta = Math.sqrt(1 - 1 / (gammaMax * gammaMax));
  const years = distanceLy / (beta * gammaMax);
  return (years * SECONDS_PER_YEAR) / 60;
}

export function reachableRadiusLy(gammaMax: number, focusMinutes: number): number {
  if (!(Number.isFinite(gammaMax) && gammaMax > 1)) {
    throw new RangeError('reachableRadiusLy: gammaMax 必须大于 1。');
  }
  if (!(Number.isFinite(focusMinutes) && focusMinutes > 0)) {
    throw new RangeError('reachableRadiusLy: focusMinutes 必须为正数。');
  }
  const focusYears = (focusMinutes * 60) / SECONDS_PER_YEAR;
  const beta = Math.sqrt(1 - 1 / (gammaMax * gammaMax));
  return beta * gammaMax * focusYears;
}

export function isReachable(distanceLy: number, focusMinutes: number, gammaMax: number): boolean {
  if (!(Number.isFinite(distanceLy) && distanceLy > 0)) {
    throw new RangeError('isReachable: distanceLy 必须为正数。');
  }
  if (!(Number.isFinite(focusMinutes) && focusMinutes > 0)) {
    throw new RangeError('isReachable: focusMinutes 必须为正数。');
  }
  if (!(Number.isFinite(gammaMax) && gammaMax > 1)) {
    throw new RangeError('isReachable: gammaMax 必须大于 1。');
  }
  return requiredGamma(distanceLy, focusMinutes) <= gammaMax;
}

export const __internal = {
  SECONDS_PER_YEAR,
  METERS_PER_LIGHT_YEAR,
};
