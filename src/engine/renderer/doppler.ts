export type Rgb = readonly [number, number, number];

export const BLUE_SATURATION_FACTOR = 5_000_000;

export function lorentzFromBeta(beta: number): number {
  if (!Number.isFinite(beta) || beta < 0 || beta >= 1) {
    throw new RangeError('lorentzFromBeta: beta 必须在 [0, 1) 区间。');
  }
  return 1 / Math.sqrt(1 - beta * beta);
}

export function dopplerFactor(beta: number, cosTheta: number): number {
  const gamma = lorentzFromBeta(beta);
  return gamma * (1 + beta * cosTheta);
}

export function blueShiftAmount(factor: number): number {
  if (!Number.isFinite(factor) || factor <= 1) return 0;
  return Math.min(1, Math.log(factor) / Math.log(BLUE_SATURATION_FACTOR));
}

export function blueShiftColor(rgb: Rgb, factor: number): Rgb {
  const e = blueShiftAmount(factor);
  if (e <= 0) return [rgb[0], rgb[1], rgb[2]];
  const [r, g, b] = rgb;
  return [
    Math.min(1, Math.max(0, r * (1 - e))),
    Math.min(1, Math.max(0, g + (b - g) * e * 0.7)),
    Math.min(1, Math.max(0, b + (1 - b) * e)),
  ];
}
