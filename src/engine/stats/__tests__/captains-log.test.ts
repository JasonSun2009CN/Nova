import { describe, expect, it } from 'vitest';

import type { VoyageRecord } from '@/contract/storage-types';
import type { VoyageSnapshot, VoyageStatus } from '@/engine/contract/voyage-types';
import {
  HEATMAP_LEVEL_MINUTES,
  aggregateMonthly,
  aggregateWeekly,
  buildHeatmap,
  computeStreakDays,
  dayStartMs,
  summarizeCaptainsLog,
} from '@/engine/stats/captains-log';

const MS_PER_MINUTE = 60_000;

const END = new Date(2026, 7, 8, 12, 0, 0).getTime();

function localDay(year: number, month: number, day: number): number {
  return new Date(year, month, day, 0, 0, 0, 0).getTime();
}

function atLocalDay(year: number, month: number, day: number, hour = 9): number {
  return new Date(year, month, day, hour, 0, 0, 0).getTime();
}

function makeSnapshot(input: {
  status: VoyageStatus;
  startWallTime: number;
  elapsedFocusMs: number;
  traveledLy: number;
}): VoyageSnapshot {
  return {
    version: 1,
    createdAt: input.startWallTime,
    opts: {
      vOverC: 0.99,
      tickIntervalMs: 250,
      infinite: false,
      focusTotalMs: input.elapsedFocusMs,
    },
    state: {
      status: input.status,
      elapsedFocusMs: input.elapsedFocusMs,
      traveledLy: input.traveledLy,
      startWallTime: input.startWallTime,
      lastTickWallTime: input.startWallTime + input.elapsedFocusMs,
      pausedSegments: [],
      currentPauseStart: null,
    },
  };
}

function makeRecord(overrides: Partial<VoyageRecord>): VoyageRecord {
  const startWallTime = overrides.startWallTime ?? atLocalDay(2026, 7, 8);
  const elapsedFocusMs = overrides.elapsedFocusMs ?? 25 * MS_PER_MINUTE;
  const base: VoyageRecord = {
    id: 'voy-test',
    status: 'completed',
    vOverC: 0.99,
    gamma: 7,
    focusTotalMs: elapsedFocusMs,
    elapsedFocusMs,
    traveledLy: 4.246,
    startWallTime,
    endWallTime: startWallTime + elapsedFocusMs,
    originStarId: 'hip-sol',
    originCoords: null,
    destStarId: 'hip-70890',
    destCoords: null,
    snapshot: makeSnapshot({
      status: 'completed',
      startWallTime,
      elapsedFocusMs,
      traveledLy: 4.246,
    }),
    starsVisitedIds: [],
    createdAt: startWallTime,
    updatedAt: startWallTime + elapsedFocusMs,
  };
  return { ...base, ...overrides };
}

describe('engine/stats/captains-log · summarizeCaptainsLog', () => {
  it('空记录：全部统计归零', () => {
    const s = summarizeCaptainsLog([], END);
    expect(s).toEqual({
      totalFocusMs: 0,
      totalTraveledLy: 0,
      exploredStarCount: 0,
      completedVoyages: 0,
      totalVoyages: 0,
      longestFocusMs: 0,
      streakDays: 0,
    });
  });

  it('累计专注/距离含中止记录，最长单次取最大 elapsedFocusMs', () => {
    const records = [
      makeRecord({ elapsedFocusMs: 25 * MS_PER_MINUTE, traveledLy: 4.246 }),
      makeRecord({ elapsedFocusMs: 50 * MS_PER_MINUTE, traveledLy: 8.5 }),
      makeRecord({ status: 'aborted', elapsedFocusMs: 10 * MS_PER_MINUTE, traveledLy: 1.2 }),
    ];
    const s = summarizeCaptainsLog(records, END);
    expect(s.totalVoyages).toBe(3);
    expect(s.totalFocusMs).toBe(85 * MS_PER_MINUTE);
    expect(s.totalTraveledLy).toBeCloseTo(4.246 + 8.5 + 1.2, 6);
    expect(s.longestFocusMs).toBe(50 * MS_PER_MINUTE);
    expect(s.completedVoyages).toBe(2);
  });

  it('已探索恒星 = 完成记录去重 destStarId，排除 null（自由漂流）与中止', () => {
    const records = [
      makeRecord({ destStarId: 'hip-70890' }),
      makeRecord({ destStarId: 'hip-70890' }),
      makeRecord({ destStarId: 'hip-91262' }),
      makeRecord({ destStarId: null }),
      makeRecord({ status: 'aborted', destStarId: 'hip-71683' }),
    ];
    expect(summarizeCaptainsLog(records, END).exploredStarCount).toBe(2);
  });
});

describe('engine/stats/captains-log · computeStreakDays', () => {
  it('空记录 streak 为 0', () => {
    expect(computeStreakDays([], END)).toBe(0);
  });

  it('今天有专注 → streak ≥ 1', () => {
    const records = [makeRecord({ startWallTime: atLocalDay(2026, 7, 8, 9) })];
    expect(computeStreakDays(records, END)).toBe(1);
  });

  it('仅昨天有专注（今天无）→ 不断签，streak = 1', () => {
    const records = [makeRecord({ startWallTime: atLocalDay(2026, 7, 7, 9) })];
    expect(computeStreakDays(records, END)).toBe(1);
  });

  it('今天与昨天都无专注 → 0', () => {
    const records = [makeRecord({ startWallTime: atLocalDay(2026, 7, 5, 9) })];
    expect(computeStreakDays(records, END)).toBe(0);
  });

  it('连续 3 天 → 3', () => {
    const records = [7, 6, 5].map((d) => makeRecord({ startWallTime: atLocalDay(2026, 7, d, 9) }));
    expect(computeStreakDays(records, END)).toBe(3);
  });

  it('中途断一天：只算到今天结尾的连续段', () => {
    const records = [
      makeRecord({ startWallTime: atLocalDay(2026, 7, 8, 9) }),
      makeRecord({ startWallTime: atLocalDay(2026, 7, 6, 9) }),
    ];
    expect(computeStreakDays(records, END)).toBe(1);
  });

  it('跨月连续：7 月底接 8 月初不断签', () => {
    const endAug1 = new Date(2026, 7, 1, 12, 0, 0).getTime();
    const records = [
      makeRecord({ startWallTime: atLocalDay(2026, 6, 31, 9) }),
      makeRecord({ startWallTime: atLocalDay(2026, 7, 1, 9) }),
    ];
    expect(computeStreakDays(records, endAug1)).toBe(2);
  });
});

describe('engine/stats/captains-log · buildHeatmap', () => {
  it('格子数 = weekCount×7，今天落在最后一列的对应周几行', () => {
    const weekCount = 4;
    const cells = buildHeatmap([], END, { weekCount });
    expect(cells).toHaveLength(weekCount * 7);

    const today = dayStartMs(END);
    const lastColStart = new Date(today);
    lastColStart.setDate(lastColStart.getDate() - ((lastColStart.getDay() + 7) % 7));
    const weekday = new Date(today).getDay();
    const todayCell = cells[weekCount * 7 - 7 + weekday]!;
    expect(todayCell.dayStartMs).toBe(today);
  });

  it('窗口外更早的记录不产生格子', () => {
    const records = [makeRecord({ startWallTime: atLocalDay(2026, 1, 1, 9) })];
    const cells = buildHeatmap(records, END, { weekCount: 4 });
    expect(cells.every((c) => c.level === 0)).toBe(true);
  });

  it('每日分钟求和与 level 阈值边界', () => {
    const cases: [number, number][] = [
      [0, 0],
      [1, 1],
      [24, 1],
      [25, 2],
      [49, 2],
      [50, 3],
      [99, 3],
      [100, 4],
    ];
    for (const [minutes, expectedLevel] of cases) {
      const records = [
        makeRecord({
          startWallTime: atLocalDay(2026, 7, 8, 9),
          elapsedFocusMs: minutes * MS_PER_MINUTE,
        }),
      ];
      const cells = buildHeatmap(records, END, { weekCount: 4 });
      const todayIdx = cells.findIndex((c) => c.dayStartMs === dayStartMs(END));
      expect(cells[todayIdx]!.minutes).toBeCloseTo(minutes, 6);
      expect(cells[todayIdx]!.level).toBe(expectedLevel);
      expect(HEATMAP_LEVEL_MINUTES).toEqual([1, 25, 50, 100]);
    }
  });
});

describe('engine/stats/captains-log · aggregateWeekly / aggregateMonthly', () => {
  it('周聚合：最近 N 周，当前周在末位，周日对齐', () => {
    const records = [makeRecord({ startWallTime: atLocalDay(2026, 7, 8, 9) })];
    const weeks = aggregateWeekly(records, END, { weekCount: 4 });
    expect(weeks).toHaveLength(4);
    const currentWeekStart = dayStartMs(END);
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - d.getDay());
    expect(weeks[3]!.startMs).toBe(d.getTime());
    expect(weeks[3]!.minutes).toBe(25);
  });

  it('月聚合：最近 N 月，当前月末位，月末专注计入当月桶', () => {
    const records = [
      makeRecord({ startWallTime: atLocalDay(2026, 6, 31, 9) }),
      makeRecord({ startWallTime: atLocalDay(2026, 7, 1, 9) }),
    ];
    const months = aggregateMonthly(records, END, { monthCount: 3 });
    expect(months).toHaveLength(3);
    expect(months[2]!.startMs).toBe(localDay(2026, 7, 1));
    const jul = months.find((m) => m.startMs === localDay(2026, 6, 1));
    const aug = months.find((m) => m.startMs === localDay(2026, 7, 1));
    expect(jul!.minutes).toBe(25);
    expect(aug!.minutes).toBe(25);
  });
});
