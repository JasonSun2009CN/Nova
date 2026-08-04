import type { SpectralType } from '@/engine/contract/catalog-types';

export type Rgb = readonly [number, number, number];

const SPECTRAL_COLORS: Record<SpectralType, Rgb> = {
  'O': [0.55, 0.65, 1.0],
  'B': [0.7, 0.8, 1.0],
  'A': [0.9, 0.92, 1.0],
  'F': [1.0, 0.95, 0.82],
  'G': [1.0, 0.93, 0.7],
  'K': [1.0, 0.82, 0.55],
  'M': [1.0, 0.65, 0.5],
  'L': [0.9, 0.5, 0.45],
  'T': [0.82, 0.42, 0.42],
  'W': [0.6, 0.8, 1.0],
  'WN': [0.55, 0.75, 1.0],
  'WC': [0.5, 0.9, 0.9],
  '?': [1.0, 1.0, 1.0],
};

function blackbodyColor(temperatureKelvin: number): Rgb {
  const t = temperatureKelvin / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  return [clamp(r) / 255, clamp(g) / 255, clamp(b) / 255];
}

export function spectralColor(type: SpectralType, temperatureKelvin?: number): Rgb {
  if (temperatureKelvin != null && temperatureKelvin > 0) {
    return blackbodyColor(temperatureKelvin);
  }
  return SPECTRAL_COLORS[type] ?? [1, 1, 1];
}
