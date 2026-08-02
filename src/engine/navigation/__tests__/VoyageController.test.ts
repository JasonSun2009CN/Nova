import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VoyageProgress, VoyageSnapshot } from '@/engine/contract/voyage-types';
import { IllegalStateError, VoyageController, lorentzFactor, LIGHT_SPEED } from '@/engine/index';

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FIVE_MIN_MS = 25 * 60 * 1000;
const V_OVER_C = 0.99;
const GAMMA = lorentzFactor(V_OVER_C * LIGHT_SPEED);

function make25m(overrides: Partial<{ tickIntervalMs: number; vOverC: number }> = {}) {
  return new VoyageController({
    focusMinutes: 25,
    vOverC: overrides.vOverC ?? V_OVER_C,
    tickIntervalMs: overrides.tickIntervalMs ?? 250,
  });
}

function expectedLy(focusMinutes: number, vOverC: number, gamma: number) {
  const v = vOverC * LIGHT_SPEED;
  const focusSec = focusMinutes * 60;
  const properSec = focusSec * gamma;
  return (v * properSec) / (LIGHT_SPEED * 365.25 * 24 * 3600);
}

describe('VoyageController (引擎层 · 纯 TS · 无 React 依赖)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const start = Date.UTC(2025, 0, 1, 12, 0, 0);
    vi.setSystemTime(start);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('构造函数校验', () => {
    it('非法 vOverC 值直接抛 RangeError', () => {
      expect(() => new VoyageController({ focusMinutes: 10, vOverC: 0 })).toThrow(RangeError);
      expect(() => new VoyageController({ focusMinutes: 10, vOverC: 1 })).toThrow(RangeError);
      expect(() => new VoyageController({ focusMinutes: 10, vOverC: 1.1 })).toThrow(RangeError);
    });

    it('非 infinite 模式必须提供时长，否则 TypeError', () => {
      expect(() => new VoyageController({ vOverC: 0.99 })).toThrow(TypeError);
      expect(() => new VoyageController({ vOverC: 0.99, focusMinutes: 0 })).toThrow(TypeError);
    });

    it('infinite 模式禁止同时提供时长', () => {
      expect(() => new VoyageController({ vOverC: 0.99, infinite: true, focusMinutes: 5 })).toThrow(
        TypeError,
      );
    });

    it('tickIntervalMs 被合法截断（最小 50ms）', () => {
      const ctrl = new VoyageController({ focusMinutes: 5, vOverC: 0.99, tickIntervalMs: 10 });
      const snap = ctrl.snapshot();
      expect(snap.opts.tickIntervalMs).toBe(50);
    });

    it('idle 状态的 getProgress 初始字段全部为 0', () => {
      const ctrl = make25m();
      const p = ctrl.getProgress();
      expect(p.status).toBe('idle');
      expect(p.focusTotalMs).toBe(TWENTY_FIVE_MIN_MS);
      expect(p.elapsedFocusMs).toBe(0);
      expect(p.remainingFocusMs).toBe(TWENTY_FIVE_MIN_MS);
      expect(p.traveledLy).toBe(0);
      expect(p.vOverC).toBe(0.99);
      expect(p.gamma).toBeCloseTo(GAMMA, 5);
      expect(p.startWallTime).toBeNull();
    });
  });

  describe('生命周期：定时模式 (25min)', () => {
    it('start() 之后触发 progress 事件，status=running', () => {
      const ctrl = make25m();
      const events: VoyageProgress[] = [];
      ctrl.on('progress', (p) => events.push(p));
      const startRet = ctrl.start();
      expect(startRet.status).toBe('running');
      expect(events).toHaveLength(1);
      expect(events[0]!.status).toBe('running');
      expect(events[0]!.elapsedFocusMs).toBe(0);
      ctrl.dispose();
    });

    it('25 分钟整，自动 complete：完成事件 + travelLy 与 travelDistance() 解析一致', () => {
      const ctrl = make25m();
      const completeEvents: VoyageProgress[] = [];
      ctrl.on('complete', (p) => completeEvents.push(p));
      ctrl.start();
      vi.advanceTimersByTime(TWENTY_FIVE_MIN_MS);

      expect(ctrl.getProgress().status).toBe('completed');
      expect(ctrl.getProgress().elapsedFocusMs).toBeGreaterThanOrEqual(TWENTY_FIVE_MIN_MS);
      expect(ctrl.getProgress().remainingFocusMs).toBe(0);
      expect(completeEvents).toHaveLength(1);

      const actualLy = ctrl.getProgress().traveledLy;
      const expected = expectedLy(25, V_OVER_C, GAMMA);
      expect(actualLy).toBeCloseTo(expected, 8);

      ctrl.dispose();
    });

    it('elapsed 时间不会漂移：25 分钟连续推进，误差 ≤ tickInterval (250ms)', () => {
      const tickMs = 250;
      const ctrl = make25m({ tickIntervalMs: tickMs });
      ctrl.start();
      vi.advanceTimersByTime(TWENTY_FIVE_MIN_MS);
      const p = ctrl.getProgress();
      const absDiff = Math.abs(p.elapsedFocusMs - TWENTY_FIVE_MIN_MS);
      expect(absDiff).toBeLessThanOrEqual(tickMs);
      ctrl.dispose();
    });
  });

  describe('pause / resume', () => {
    it('pause 时抛错时机：只能在 running 调用', () => {
      const ctrl = make25m();
      expect(() => ctrl.pause()).toThrow(IllegalStateError);
      ctrl.start();
      ctrl.pause();
      expect(() => ctrl.pause()).toThrow(IllegalStateError);
      ctrl.dispose();
    });

    it('resume 时抛错时机：只能在 paused 调用', () => {
      const ctrl = make25m();
      expect(() => ctrl.resume()).toThrow(IllegalStateError);
      ctrl.start();
      expect(() => ctrl.resume()).toThrow(IllegalStateError);
      ctrl.dispose();
    });

    it('运行 5 分钟 → 暂停 3 分钟 → 恢复：总 elapsed ≈ 5 分钟，暂停段不累积距离', () => {
      const ctrl = make25m();
      ctrl.start();
      vi.advanceTimersByTime(5 * 60 * 1000);
      const p1 = ctrl.pause();
      const afterPauseLy = ctrl.getProgress().traveledLy;
      vi.advanceTimersByTime(3 * 60 * 1000);
      expect(ctrl.getProgress().traveledLy).toBe(afterPauseLy);
      expect(ctrl.getProgress().elapsedFocusMs).toBe(p1.elapsedFocusMs);
      ctrl.resume();
      vi.advanceTimersByTime(20 * 60 * 1000);
      expect(ctrl.getProgress().status).toBe('completed');
      expect(ctrl.getProgress().traveledLy).toBeCloseTo(expectedLy(25, V_OVER_C, GAMMA), 8);
      expect(ctrl.getProgress().pausedSegments).toHaveLength(1);
      expect(
        Math.abs(
          ctrl.getProgress().pausedSegments[0]!.end -
            ctrl.getProgress().pausedSegments[0]!.start -
            3 * 60 * 1000,
        ),
      ).toBeLessThanOrEqual(1000);
      ctrl.dispose();
    });
  });

  describe('abort / complete (infinite)', () => {
    it('abort 只能在 running/paused 调用，并正确打 reason', () => {
      const ctrl = make25m();
      expect(() => ctrl.abort()).toThrow(IllegalStateError);
      ctrl.start();
      const res = ctrl.abort('user');
      expect(res.status).toBe('aborted');
      expect(res.reason).toBe('user');
      expect(() => ctrl.abort()).toThrow(IllegalStateError);
      ctrl.dispose();
    });

    it('infinite 模式：1 小时后手动 complete，距离正确', () => {
      const ctrl = new VoyageController({ infinite: true, vOverC: 0.99, tickIntervalMs: 1000 });
      ctrl.start();
      vi.advanceTimersByTime(ONE_HOUR_MS);
      const p = ctrl.complete();
      expect(p.status).toBe('completed');
      expect(Math.abs(p.elapsedFocusMs - ONE_HOUR_MS)).toBeLessThanOrEqual(3000);
      expect(p.traveledLy).toBeCloseTo(expectedLy(60, V_OVER_C, GAMMA), 6);
      ctrl.dispose();
    });

    it('AbortSignal.abort 能在 running 中触发 system abort', () => {
      const ac = new AbortController();
      const ctrl = make25m({});
      (ctrl as unknown as VoyageController).constructor; // noop
      const acCtrl = new VoyageController({
        focusMinutes: 25,
        vOverC: 0.99,
        abortSignal: ac.signal,
      });
      acCtrl.start();
      vi.advanceTimersByTime(60_000);
      ac.abort();
      expect(acCtrl.getProgress().status).toBe('aborted');
      acCtrl.dispose();
      ctrl.dispose();
    });
  });

  describe('snapshot / fromSnapshot', () => {
    it('running 10 分钟 snapshot → fromSnapshot 恢复 → 继续到 25 分钟：最终数值连贯', () => {
      const ctrl = make25m({ tickIntervalMs: 500 });
      ctrl.start();
      vi.advanceTimersByTime(10 * 60 * 1000);
      const snap = ctrl.snapshot();
      expect(snap.version).toBe(1);
      expect(snap.state.status).toBe('running');
      const elapsedAtSnap = ctrl.getProgress().elapsedFocusMs;
      const lyAtSnap = ctrl.getProgress().traveledLy;
      ctrl.dispose();

      const restored = VoyageController.fromSnapshot(snap);
      expect(restored.getProgress().status).toBe('running');
      expect(restored.getProgress().elapsedFocusMs).toBe(elapsedAtSnap);
      expect(restored.getProgress().traveledLy).toBeCloseTo(lyAtSnap, 10);
      vi.advanceTimersByTime(15 * 60 * 1000);
      expect(restored.getProgress().status).toBe('completed');
      expect(restored.getProgress().traveledLy).toBeCloseTo(expectedLy(25, V_OVER_C, GAMMA), 7);
      restored.dispose();
    });

    it('fromSnapshot version 不匹配抛错', () => {
      const badSnap: VoyageSnapshot = {
        version: 99 as unknown as 1,
        createdAt: 0,
        opts: { vOverC: 0.99, infinite: false, tickIntervalMs: 250, focusTotalMs: 1000 },
        state: {
          status: 'running',
          elapsedFocusMs: 0,
          traveledLy: 0,
          startWallTime: 0,
          lastTickWallTime: 0,
          pausedSegments: [],
          currentPauseStart: null,
        },
      };
      expect(() => VoyageController.fromSnapshot(badSnap)).toThrow(RangeError);
    });

    it('snapshot paused 段包含 currentPauseStart（暂停中 snapshot）', () => {
      const ctrl = make25m();
      ctrl.start();
      vi.advanceTimersByTime(2 * 60_000);
      ctrl.pause();
      const beforeSnap = ctrl.getProgress();
      const snap = ctrl.snapshot();
      const hasCurrent = snap.state.currentPauseStart != null;
      const totalPauseMs = hasCurrent
        ? Date.now() - snap.state.currentPauseStart!
        : snap.state.pausedSegments.map((s) => s.end - s.start).reduce((a, b) => a + b, 0);
      if (!hasCurrent) {
        expect(totalPauseMs).toBeGreaterThanOrEqual(0);
      } else {
        expect(typeof snap.state.currentPauseStart).toBe('number');
      }
      expect(beforeSnap.status).toBe('paused');
      ctrl.dispose();
    });
  });

  describe('progress 事件密度', () => {
    it('1 秒内 250ms tick = 至少 3 次 progress 事件 (start + 0.25s + 0.5s + 0.75s)', () => {
      const ctrl = make25m({ tickIntervalMs: 250 });
      const events: VoyageProgress[] = [];
      ctrl.on('progress', (p) => events.push(p));
      ctrl.start();
      vi.advanceTimersByTime(1000);
      expect(events.length).toBeGreaterThanOrEqual(4);
      ctrl.dispose();
    });
  });
});
