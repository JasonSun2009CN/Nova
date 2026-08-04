import { describe, expect, it } from 'vitest';

import {
  equatorialToGalacticCartesian,
  parseSpectral,
  protoToStar,
} from '@/engine/data/star-mapper';

describe('parseSpectral', () => {
  it('G2V → G 型主序星', () => {
    expect(parseSpectral('G2V')).toEqual({ type: 'G', subclass: 2, luminosityClass: 'V' });
  });

  it('A0Va → A 型 0 亚型主序星', () => {
    expect(parseSpectral('A0Va')).toEqual({ type: 'A', subclass: 0, luminosityClass: 'V' });
  });

  it('K5+III → K 型、亚型 5', () => {
    const spec = parseSpectral('K5+III');
    expect(spec.type).toBe('K');
    expect(spec.subclass).toBe(5);
  });

  it('M1-2Ia-Iab → M 型超巨星，亚型 1', () => {
    const spec = parseSpectral('M1-2Ia-Iab');
    expect(spec.type).toBe('M');
    expect(spec.subclass).toBe(1);
  });

  it('未知光谱回退为 ?', () => {
    expect(parseSpectral('DA').type).toBe('?');
  });
});

describe('equatorialToGalacticCartesian', () => {
  it('比邻星 4.246ly 笛卡尔模长 ≈ 4.246', () => {
    const { cartesian } = equatorialToGalacticCartesian(217.428, -62.6795, 4.246);
    const r = Math.hypot(cartesian.xLy, cartesian.yLy, cartesian.zLy);
    expect(r).toBeCloseTo(4.246, 3);
  });

  it('距离 0 落在原点', () => {
    const { cartesian } = equatorialToGalacticCartesian(0, 0, 0);
    expect(cartesian.xLy).toBeCloseTo(0, 6);
    expect(cartesian.yLy).toBeCloseTo(0, 6);
    expect(cartesian.zLy).toBeCloseTo(0, 6);
  });

  it('银心方向（Sgr A*）→ 指向 +x（l≈0°, b≈0°）', () => {
    const { cartesian } = equatorialToGalacticCartesian(266.417, -29.008, 10);
    expect(cartesian.xLy).toBeCloseTo(10, 0);
    expect(cartesian.yLy).toBeCloseTo(0, 0);
    expect(cartesian.zLy).toBeCloseTo(0, 0);
  });

  it('银北极方向 → 指向 +z（b≈90°）', () => {
    const { cartesian } = equatorialToGalacticCartesian(192.859, 27.128, 10);
    expect(cartesian.xLy).toBeCloseTo(0, 0);
    expect(cartesian.yLy).toBeCloseTo(0, 0);
    expect(cartesian.zLy).toBeCloseTo(10, 0);
  });
});

describe('protoToStar', () => {
  it('hip-32349 → hipId=32349', () => {
    const star = protoToStar({
      id: 'hip-32349',
      raDeg: 0,
      decDeg: 0,
      distanceLy: 1,
      vMag: 1,
      spectral: 'K',
    });
    expect(star.hipId).toBe(32349);
  });

  it('hip-fake-1000000 → hipId=1000000', () => {
    const star = protoToStar({
      id: 'hip-fake-1000000',
      raDeg: 0,
      decDeg: 0,
      distanceLy: 1,
      vMag: 1,
      spectral: 'K',
    });
    expect(star.hipId).toBe(1000000);
  });
});
