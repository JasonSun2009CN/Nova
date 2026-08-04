import { describe, expect, it } from 'vitest';

import type { Star } from '@/engine/contract/catalog-types';
import { buildStarPoints } from '@/engine/renderer/build-star-points';

function makeStar(overrides: Partial<Star>): Star {
  return {
    id: 'hip-test',
    coords: {
      equatorial: { raDeg: 0, decDeg: 0, parallaxMas: null },
      galactic: { lDeg: 0, bDeg: 0, distanceLy: 1 },
      cartesian: { xLy: 0, yLy: 0, zLy: 0 },
    },
    spectral: { type: 'G' },
    apparentMagnitude: 1,
    absoluteMagnitude: 1,
    catalogTier: 'tier1-nearby-100ly',
    ...overrides,
  };
}

describe('buildStarPoints', () => {
  it('3 颗星 → count=3，positions/colors 各 9 个数，sizes 3 个', () => {
    const stars = [makeStar({}), makeStar({ id: 'b' }), makeStar({ id: 'c' })];
    const pts = buildStarPoints(stars);
    expect(pts.count).toBe(3);
    expect(pts.positions.length).toBe(9);
    expect(pts.colors.length).toBe(9);
    expect(pts.sizes.length).toBe(3);
  });

  it('位置按 coords.cartesian × scale 写入', () => {
    const star = makeStar({
      coords: {
        equatorial: { raDeg: 0, decDeg: 0, parallaxMas: null },
        galactic: { lDeg: 0, bDeg: 0, distanceLy: 1 },
        cartesian: { xLy: 2, yLy: 4, zLy: 6 },
      },
    });
    const pts = buildStarPoints([star], { scale: 0.5 });
    expect(pts.positions[0]).toBe(1);
    expect(pts.positions[1]).toBe(2);
    expect(pts.positions[2]).toBe(3);
  });

  it('G 型星（无温度）颜色偏黄', () => {
    const pts = buildStarPoints([makeStar({ spectral: { type: 'G' } })]);
    expect(pts.colors[0]).toBeCloseTo(1, 2);
    expect(pts.colors[1]).toBeCloseTo(0.93, 2);
  });

  it('更亮的星（更小视星等）尺寸更大', () => {
    const bright = buildStarPoints([makeStar({ apparentMagnitude: 0 })]);
    const dim = buildStarPoints([makeStar({ apparentMagnitude: 5 })]);
    expect(bright.sizes[0]!).toBeGreaterThan(dim.sizes[0]!);
  });
});
