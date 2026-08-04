import { describe, expect, it } from 'vitest';

import {
  LIGHT_SPEED,
  cruisePlan,
  lorentzFactor,
  requiredFocusMinutes,
  travelDistance,
} from '@/engine/physics/lorentz';

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

  describe('requiredFocusMinutes()', () => {
    it('是 travelDistance 的逆运算：25 分钟 × 0.99c 往返一致', () => {
      const dist = travelDistance({ focusMinutes: 25, vOverC: 0.99 });
      expect(requiredFocusMinutes(dist, 0.99)).toBeCloseTo(25, 5);
    });

    it('1 小时 × 0.9c 往返一致', () => {
      const dist = travelDistance({ focusHours: 1, vOverC: 0.9 });
      expect(requiredFocusMinutes(dist, 0.9)).toBeCloseTo(60, 5);
    });

    it('比邻星 4.246ly @0.99c ≈ 31.8 万分钟', () => {
      const minutes = requiredFocusMinutes(4.246, 0.99);
      expect(minutes).toBeGreaterThan(300_000);
      expect(minutes).toBeLessThan(340_000);
    });

    it('织女星 25.04ly @0.99c ≈ 187 万分钟（约 3.6 年）', () => {
      const minutes = requiredFocusMinutes(25.04, 0.99);
      expect(minutes).toBeGreaterThan(1_800_000);
      expect(minutes).toBeLessThan(1_950_000);
    });

    it('distanceLy 非正或 vOverC 越界抛 RangeError', () => {
      expect(() => requiredFocusMinutes(0, 0.99)).toThrow(RangeError);
      expect(() => requiredFocusMinutes(-1, 0.99)).toThrow(RangeError);
      expect(() => requiredFocusMinutes(10, 0)).toThrow(RangeError);
      expect(() => requiredFocusMinutes(10, 1)).toThrow(RangeError);
    });
  });

  describe('cruisePlan()', () => {
    it('是 travelDistance 的逆运算：推算速度后往返还原距离', () => {
      const plan = cruisePlan({ focusMinutes: 25, distanceLy: 4.246 });
      const dist = travelDistance({ focusMinutes: 25, vOverC: plan.vOverC });
      expect(dist).toBeCloseTo(4.246, 3);
    });

    it('25 分钟 → 比邻星：γ=√(1+R²)，β 略小于 1，地球历时≈距离', () => {
      const focusYears = (25 * 60) / (365.25 * 24 * 3600);
      const rapidity = 4.246 / focusYears;
      const expectedGamma = Math.sqrt(1 + rapidity * rapidity);
      const plan = cruisePlan({ focusMinutes: 25, distanceLy: 4.246 });
      expect(plan.gamma).toBeCloseTo(expectedGamma, 5);
      expect(plan.vOverC).toBeLessThan(1);
      expect(plan.vOverC).toBeGreaterThan(0.999_999_999);
      expect(plan.earthYears).toBeCloseTo(4.246, 3);
    });

    it('距离更远 → 需更快、γ 更大', () => {
      const near = cruisePlan({ focusMinutes: 25, distanceLy: 4.246 });
      const far = cruisePlan({ focusMinutes: 25, distanceLy: 25.04 });
      expect(far.gamma).toBeGreaterThan(near.gamma);
      expect(far.vOverC).toBeGreaterThan(near.vOverC);
    });

    it('专注更短 → 需更快、γ 更大', () => {
      const long = cruisePlan({ focusMinutes: 60, distanceLy: 4.246 });
      const short = cruisePlan({ focusMinutes: 15, distanceLy: 4.246 });
      expect(short.gamma).toBeGreaterThan(long.gamma);
      expect(short.vOverC).toBeGreaterThan(long.vOverC);
    });

    it('focusMinutes 或 distanceLy 非正抛 RangeError', () => {
      expect(() => cruisePlan({ focusMinutes: 0, distanceLy: 4.246 })).toThrow(RangeError);
      expect(() => cruisePlan({ focusMinutes: -1, distanceLy: 4.246 })).toThrow(RangeError);
      expect(() => cruisePlan({ focusMinutes: 25, distanceLy: 0 })).toThrow(RangeError);
      expect(() => cruisePlan({ focusMinutes: 25, distanceLy: Number.NaN })).toThrow(RangeError);
    });
  });
});
