import { describe, expect, it } from 'vitest';

import {
  LIGHT_SPEED,
  cruisePlan,
  isReachable,
  lorentzFactor,
  minFocusMinutes,
  reachableRadiusLy,
  requiredFocusMinutes,
  requiredGamma,
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

    it('S29 极端相对论精度：β→1（1-1e-9 ~ 1-1e-14）相对误差 < 1e-3（v↔β 往返舍入界）', () => {
      const epsilons = [1e-9, 1e-10, 1e-11, 1e-12, 1e-13, 1e-14];
      for (const eps of epsilons) {
        const beta = 1 - eps;
        const v = beta * LIGHT_SPEED;
        const exact = 1 / Math.sqrt(2 * eps - eps * eps);
        const computed = lorentzFactor(v);
        const relErr = Math.abs(computed - exact) / exact;
        // lorentzFactor 对 β>0.999999 用 1/√(2ε) 近似；v→β 往返有 ~1e-16 舍入，极端 ε 下被放大
        expect(relErr).toBeLessThan(1e-3);
      }
    });

    it('S29 γ 数值稳定性：β=1-1e-9 时 γ ≈ 22360 且有限（接近 c 不 NaN）', () => {
      const g = lorentzFactor((1 - 1e-9) * LIGHT_SPEED);
      expect(Number.isFinite(g)).toBe(true);
      const exact = 1 / Math.sqrt(2e-9);
      const relErr = Math.abs(g - exact) / exact;
      expect(relErr).toBeLessThan(1e-4);
    });

    it('S29 γ 精度单调：β 越大 γ 越大，且符合 γ ≥ 1', () => {
      const betas = [0.5, 0.9, 0.99, 0.999, 0.9999, 0.99999];
      let prev = 0;
      for (const b of betas) {
        const g = lorentzFactor(b * LIGHT_SPEED);
        expect(g).toBeGreaterThanOrEqual(1);
        expect(g).toBeGreaterThan(prev);
        prev = g;
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

  describe('requiredGamma() 所需 γ（d=β·γ·τ 统一模型）', () => {
    it('25 分钟 → 比邻星 4.246ly：γ≈89,300，与 cruisePlan 一致', () => {
      const gamma = requiredGamma(4.246, 25);
      expect(gamma).toBeGreaterThan(89_000);
      expect(gamma).toBeLessThan(90_000);
      expect(gamma).toBeCloseTo(cruisePlan({ focusMinutes: 25, distanceLy: 4.246 }).gamma, 6);
    });

    it('25 分钟 → 织女 25.04ly：γ≈526,000，超出常规引擎 γ_max（10 万）', () => {
      const gamma = requiredGamma(25.04, 25);
      expect(gamma).toBeGreaterThan(520_000);
      expect(gamma).toBeLessThan(530_000);
    });

    it('distanceLy 或 focusMinutes 非正抛 RangeError', () => {
      expect(() => requiredGamma(0, 25)).toThrow(RangeError);
      expect(() => requiredGamma(-1, 25)).toThrow(RangeError);
      expect(() => requiredGamma(4.246, 0)).toThrow(RangeError);
      expect(() => requiredGamma(4.246, Number.NaN)).toThrow(RangeError);
    });
  });

  describe('minFocusMinutes() 当前引擎最短专注', () => {
    it('比邻星 @γ_max=10 万 ≈ 22 分钟（ADR 默认引擎 25 分钟可达近星）', () => {
      const minutes = minFocusMinutes(4.246, 100_000);
      expect(minutes).toBeGreaterThan(22);
      expect(minutes).toBeLessThan(23);
    });

    it('织女 25.04ly @γ_max=10 万 ≈ 2.2 小时', () => {
      const minutes = minFocusMinutes(25.04, 100_000);
      expect(minutes).toBeGreaterThan(130);
      expect(minutes).toBeLessThan(133);
    });

    it('γ_max 更大 → 最短专注更少；距离更远 → 最短专注更多', () => {
      expect(minFocusMinutes(4.246, 400_000)).toBeLessThan(minFocusMinutes(4.246, 100_000));
      expect(minFocusMinutes(25.04, 100_000)).toBeGreaterThan(minFocusMinutes(4.246, 100_000));
    });

    it('distanceLy 非正或 gammaMax ≤ 1 抛 RangeError', () => {
      expect(() => minFocusMinutes(0, 100_000)).toThrow(RangeError);
      expect(() => minFocusMinutes(-1, 100_000)).toThrow(RangeError);
      expect(() => minFocusMinutes(4.246, 1)).toThrow(RangeError);
      expect(() => minFocusMinutes(4.246, Number.NaN)).toThrow(RangeError);
    });
  });

  describe('reachableRadiusLy() 引擎可达半径', () => {
    it('25 分钟 @γ_max=10 万 ≈ 4.76ly（ADR 表 常规引擎 ~4.8ly）', () => {
      const radius = reachableRadiusLy(100_000, 25);
      expect(radius).toBeGreaterThan(4.7);
      expect(radius).toBeLessThan(4.8);
    });

    it('25 分钟各档引擎可达半径对照 ADR 表（~19 / ~57 / ~238 / ~951ly）', () => {
      expect(reachableRadiusLy(400_000, 25)).toBeCloseTo(19.0, 1);
      expect(reachableRadiusLy(1_200_000, 25)).toBeCloseTo(57.0, 1);
      expect(reachableRadiusLy(5_000_000, 25)).toBeCloseTo(237.7, 0);
      expect(reachableRadiusLy(20_000_000, 25)).toBeCloseTo(950.7, 0);
    });

    it('专注更长 → 可达半径更大', () => {
      expect(reachableRadiusLy(100_000, 50)).toBeGreaterThan(reachableRadiusLy(100_000, 25));
    });

    it('gammaMax ≤ 1 或 focusMinutes 非正抛 RangeError', () => {
      expect(() => reachableRadiusLy(1, 25)).toThrow(RangeError);
      expect(() => reachableRadiusLy(100_000, 0)).toThrow(RangeError);
      expect(() => reachableRadiusLy(100_000, Number.NaN)).toThrow(RangeError);
    });
  });

  describe('isReachable() 可达性判定', () => {
    it('比邻星 25 分钟 @常规引擎（γ_max=10 万）可达', () => {
      expect(isReachable(4.246, 25, 100_000)).toBe(true);
    });

    it('织女 25 分钟 @常规引擎不可达，@曲速二级（1.2M）可达', () => {
      expect(isReachable(25.04, 25, 100_000)).toBe(false);
      expect(isReachable(25.04, 25, 1_200_000)).toBe(true);
    });

    it('拉长专注至 150 分钟 → 织女在常规引擎下变为可达', () => {
      expect(isReachable(25.04, 120, 100_000)).toBe(false);
      expect(isReachable(25.04, 150, 100_000)).toBe(true);
    });

    it('参数非法抛 RangeError', () => {
      expect(() => isReachable(0, 25, 100_000)).toThrow(RangeError);
      expect(() => isReachable(4.246, 0, 100_000)).toThrow(RangeError);
      expect(() => isReachable(4.246, 25, 1)).toThrow(RangeError);
    });
  });
});
