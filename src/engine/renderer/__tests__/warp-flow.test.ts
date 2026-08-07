import { describe, expect, it } from 'vitest';

import {
  ARRIVE_DURATION_MS,
  BRAKE_DURATION_MS,
  LAUNCH_DURATION_MS,
  easeInCubic,
  easeOutCubic,
  flowIntensity,
  nextPhaseAfterDuration,
  phaseDurationMs,
  transitionProgress,
} from '@/engine/renderer/warp-flow';

describe('engine/renderer/warp-flow 跃迁过渡相位', () => {
  describe('phaseDurationMs() 各相位时长', () => {
    it('三过渡均为 3s（启动/到达/刹车）', () => {
      expect(LAUNCH_DURATION_MS).toBe(3000);
      expect(ARRIVE_DURATION_MS).toBe(3000);
      expect(BRAKE_DURATION_MS).toBe(3000);
    });

    it('巡航/无相位无动画时长', () => {
      expect(phaseDurationMs('cruising')).toBe(0);
      expect(phaseDurationMs(null)).toBe(0);
    });
  });

  describe('transitionProgress() 过渡进度归一化', () => {
    it('0ms 起 0，时长到 1，超时封顶 1', () => {
      expect(transitionProgress('launching', 0)).toBe(0);
      expect(transitionProgress('launching', LAUNCH_DURATION_MS)).toBe(1);
      expect(transitionProgress('launching', 10_000)).toBe(1);
    });

    it('中途线性比例（30% 时长 → 0.3）', () => {
      expect(transitionProgress('arriving', ARRIVE_DURATION_MS * 0.3)).toBeCloseTo(0.3, 6);
    });

    it('非过渡相位恒 0', () => {
      expect(transitionProgress('cruising', 1500)).toBe(0);
      expect(transitionProgress(null, 1500)).toBe(0);
    });
  });

  describe('flowIntensity() 近观星流流速曲线', () => {
    it('巡航/到达无星流（强度恒 0）', () => {
      expect(flowIntensity('cruising', 1000)).toBe(0);
      expect(flowIntensity('arriving', 1000)).toBe(0);
      expect(flowIntensity(null, 1000)).toBe(0);
    });

    it('启动点火：0 缓入加速到满速', () => {
      expect(flowIntensity('launching', 0)).toBe(0);
      expect(flowIntensity('launching', LAUNCH_DURATION_MS)).toBe(1);
      expect(flowIntensity('launching', LAUNCH_DURATION_MS * 0.5)).toBeCloseTo(easeInCubic(0.5), 6);
      expect(flowIntensity('launching', 10_000)).toBe(1);
    });

    it('中断刹车：满速缓出减速到 0', () => {
      expect(flowIntensity('braking', 0)).toBe(1);
      expect(flowIntensity('braking', BRAKE_DURATION_MS)).toBe(0);
      expect(flowIntensity('braking', BRAKE_DURATION_MS * 0.5)).toBeCloseTo(
        1 - easeOutCubic(0.5),
        6,
      );
      expect(flowIntensity('braking', 10_000)).toBe(0);
    });

    it('强度始终落在 [0,1]', () => {
      for (const phase of ['launching', 'braking'] as const) {
        for (let ms = 0; ms <= LAUNCH_DURATION_MS; ms += 250) {
          const v = flowIntensity(phase, ms);
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('nextPhaseAfterDuration() 相位自动续接', () => {
    it('启动 3s → 巡航', () => {
      expect(nextPhaseAfterDuration('launching')).toBe('cruising');
    });

    it('到达/刹车 3s → 无过渡（回主视图）', () => {
      expect(nextPhaseAfterDuration('arriving')).toBeNull();
      expect(nextPhaseAfterDuration('braking')).toBeNull();
    });

    it('巡航保持巡航', () => {
      expect(nextPhaseAfterDuration('cruising')).toBe('cruising');
      expect(nextPhaseAfterDuration(null)).toBeNull();
    });
  });
});
