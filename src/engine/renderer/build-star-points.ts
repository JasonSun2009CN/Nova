import type { Star } from '@/engine/contract/catalog-types';
import { spectralColor, type Rgb } from '@/engine/renderer/star-colors';

export type StarPoints = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  count: number;
};

export type BuildStarPointsOptions = {
  scale?: number;
  sizeScale?: number;
};

function magnitudeSize(apparentMagnitude: number): number {
  return Math.max(0.2, 6 - apparentMagnitude);
}

export function buildStarPoints(
  stars: readonly Star[],
  opts: BuildStarPointsOptions = {},
): StarPoints {
  const scale = opts.scale ?? 1;
  const sizeScale = opts.sizeScale ?? 1;
  const count = stars.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  stars.forEach((star, i) => {
    const c = star.coords.cartesian;
    positions[i * 3] = c.xLy * scale;
    positions[i * 3 + 1] = c.yLy * scale;
    positions[i * 3 + 2] = c.zLy * scale;
    const rgb: Rgb = spectralColor(star.spectral.type, star.temperatureKelvin);
    colors[i * 3] = rgb[0];
    colors[i * 3 + 1] = rgb[1];
    colors[i * 3 + 2] = rgb[2];
    sizes[i] = magnitudeSize(star.apparentMagnitude) * sizeScale;
  });

  return { positions, colors, sizes, count };
}
