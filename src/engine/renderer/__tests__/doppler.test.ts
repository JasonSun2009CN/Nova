import { describe, expect, it } from 'vitest';

import {
  BLUE_SATURATION_FACTOR,
  blueShiftAmount,
  blueShiftColor,
  dopplerFactor,
  lorentzFromBeta,
} from '@/engine/renderer/doppler';

describe('engine/renderer/doppler 前向蓝移（只蓝不红）', () => {
  describe('dopplerFactor() 频率比', () => {
    it('β=0 时任意方向频率比 = 1', () => {
      expect(dopplerFactor(0, 1)).toBeCloseTo(1, 9);
      expect(dopplerFactor(0, -1)).toBeCloseTo(1, 9);
      expect(dopplerFactor(0, 0)).toBeCloseTo(1, 9);
    });

    it('正前方（cosθ=1）→ γ(1+β)，> 1 蓝移', () => {
      const beta = 0.5;
      const gamma = lorentzFromBeta(beta);
      expect(dopplerFactor(beta, 1)).toBeCloseTo(gamma * 1.5, 6);
    });

    it('正后方（cosθ=-1）→ γ(1-β)，< 1 红移（但只蓝不红，UI 不显示）', () => {
      const beta = 0.5;
      const gamma = lorentzFromBeta(beta);
      expect(dopplerFactor(beta, -1)).toBeCloseTo(gamma * 0.5, 6);
      expect(dopplerFactor(beta, -1)).toBeLessThan(1);
    });

    it('β 越接近 1，正前方频率比越大（≈2γ）', () => {
      const f = dopplerFactor(0.99, 1);
      const gamma = lorentzFromBeta(0.99);
      expect(f).toBeGreaterThan(gamma);
      expect(f).toBeLessThan(2 * gamma);
    });

    it('beta 非法抛 RangeError', () => {
      expect(() => dopplerFactor(-0.1, 0)).toThrow(RangeError);
      expect(() => dopplerFactor(1, 0)).toThrow(RangeError);
    });
  });

  describe('blueShiftAmount() 蓝化程度', () => {
    it('factor ≤ 1 → 0（不蓝也不红）', () => {
      expect(blueShiftAmount(1)).toBe(0);
      expect(blueShiftAmount(0.5)).toBe(0);
      expect(blueShiftAmount(Number.NaN)).toBe(0);
    });

    it('单调递增并在饱和因子处封顶 1', () => {
      expect(blueShiftAmount(10)).toBeGreaterThan(0);
      expect(blueShiftAmount(1_000_000)).toBeGreaterThan(blueShiftAmount(10));
      expect(blueShiftAmount(BLUE_SATURATION_FACTOR)).toBe(1);
      expect(blueShiftAmount(10_000_000)).toBe(1);
    });
  });

  describe('blueShiftColor() 颜色蓝移', () => {
    it('factor=1 → 颜色不变（恒等）', () => {
      expect(blueShiftColor([0.8, 0.5, 0.3], 1)).toEqual([0.8, 0.5, 0.3]);
    });

    it('只蓝不红：红色通道不增、蓝色通道不降', () => {
      const before = [0.8, 0.5, 0.3] as const;
      const after = blueShiftColor(before, 1000);
      expect(after[0]).toBeLessThanOrEqual(before[0]);
      expect(after[2]).toBeGreaterThanOrEqual(before[2]);
    });

    it('极端蓝移 → 颜色趋向蓝色（红降、蓝升）', () => {
      const after = blueShiftColor([0.8, 0.4, 0.2], 100_000);
      expect(after[0]).toBeLessThan(0.3);
      expect(after[2]).toBeGreaterThan(0.7);
    });

    it('输出始终在 [0,1] 内', () => {
      for (const factor of [1, 10, 1000, 100_000]) {
        const c = blueShiftColor([1, 1, 1], factor);
        expect(c[0]).toBeGreaterThanOrEqual(0);
        expect(c[2]).toBeLessThanOrEqual(1);
      }
    });
  });
});
