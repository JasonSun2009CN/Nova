import { describe, expect, it } from 'vitest';

import { LIGHT_SPEED, lorentzFactor, travelDistance } from '@/engine/physics/lorentz';

describe('engine/physics/lorentz', () => {
  describe('LIGHT_SPEED constant', () => {
    it('equals 299,792,458 m/s (CODATA 2018)', () => {
      expect(LIGHT_SPEED).toBe(299_792_458);
    });
  });

  describe('lorentzFactor()', () => {
    it('returns exactly 1 when v = 0', () => {
      expect(lorentzFactor(0)).toBe(1);
    });

    it('returns ~7.0888 at v = 0.99c (Hipparcos 精度基准)', () => {
      const v = 0.99 * LIGHT_SPEED;
      expect(lorentzFactor(v)).toBeCloseTo(7.088_812_076, 6);
    });

    it('returns ~2.294 at v = 0.9c', () => {
      const v = 0.9 * LIGHT_SPEED;
      expect(lorentzFactor(v)).toBeCloseTo(2.294_157, 5);
    });

    it('returns ~22.366 at v = 0.999c (曲速一级目标)', () => {
      const v = 0.999 * LIGHT_SPEED;
      expect(lorentzFactor(v)).toBeCloseTo(22.366_272, 5);
    });

    it('throws RangeError when v >= c (物理不可能)', () => {
      expect(() => lorentzFactor(LIGHT_SPEED)).toThrow(RangeError);
      expect(() => lorentzFactor(LIGHT_SPEED * 1.1)).toThrow(RangeError);
    });

    it('numerically stable for v extremely close to c (v/c = 1 - 1e-12)', () => {
      const v = LIGHT_SPEED * (1 - 1e-12);
      const gamma = lorentzFactor(v);
      const expected = 1 / Math.sqrt(2 * 1e-12);
      expect(Number.isFinite(gamma)).toBe(true);
      expect(gamma).toBeCloseTo(expected, -3);
      expect(gamma).toBeGreaterThan(7e5);
    });

    it('sub 1e-9 relative error vs naive formula for 0.5c..0.9999c', () => {
      const factors = [0.5, 0.9, 0.99, 0.999, 0.9999];
      for (const f of factors) {
        const v = f * LIGHT_SPEED;
        const beta = f;
        const naive = 1 / Math.sqrt(1 - beta * beta);
        const computed = lorentzFactor(v);
        const relErr = Math.abs(computed - naive) / naive;
        expect(relErr).toBeLessThan(1e-9);
      }
    });
  });

  describe('travelDistance()', () => {
    it('1小时专注 × v=0.99c 应约等于 7.09 光时 ≈ 0.000809 光年', () => {
      const hours = 1;
      const v = 0.99 * LIGHT_SPEED;
      const distLy = travelDistance({ focusHours: hours, vOverC: 0.99 });
      const lightHours = lorentzFactor(v) * hours * 0.99;
      expect(distLy).toBeCloseTo(lightHours / 8766, 5);
      expect(distLy).toBeGreaterThan(0.0008);
      expect(distLy).toBeLessThan(0.00082);
    });

    it('25分钟番茄钟 × v=0.99c ≈ 0.000337 光年', () => {
      const minutes = 25;
      const dist = travelDistance({ focusMinutes: minutes, vOverC: 0.99 });
      expect(dist).toBeCloseTo(
        (lorentzFactor(0.99 * LIGHT_SPEED) * 0.99 * (minutes / 60)) / 8766,
        5,
      );
      expect(dist).toBeGreaterThan(0.0003);
      expect(dist).toBeLessThan(0.00034);
    });

    it('throws if neither focusMinutes nor focusHours provided', () => {
      // @ts-expect-error - intentionally missing required field
      expect(() => travelDistance({ vOverC: 0.99 })).toThrow(TypeError);
    });
  });
});
