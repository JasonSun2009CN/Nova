import { describe, expect, it } from 'vitest';

import type { VoyageRecord } from '@/contract/storage-types';
import type { VoyageSnapshot, VoyageStatus } from '@/engine/contract/voyage-types';
import {
  ACHIEVEMENT_TOTAL_POINTS,
  ACHIEVEMENTS,
  getAchievementById,
} from '@/engine/achievements/catalog';
import {
  buildAchievementContext,
  buildAchievementStarFacts,
  evaluateAchievements,
  grantedEngineTiers,
  newlyUnlockedAchievementIds,
  unlockedAchievementIds,
} from '@/engine';

const MS_PER_MINUTE = 60_000;

const END = new Date(2026, 7, 8, 12, 0, 0).getTime();

const FACTS = buildAchievementStarFacts();

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

function makeRecord(overrides: Partial<VoyageRecord> & { startWallTime: number }): VoyageRecord {
  const { startWallTime, status = 'completed' } = overrides;
  const elapsedFocusMs = overrides.elapsedFocusMs ?? 25 * MS_PER_MINUTE;
  const destStarId = overrides.destStarId ?? 'hip-70890';
  const traveledLy = overrides.traveledLy ?? 4.246;
  const base: VoyageRecord = {
    id: 'voy-test',
    status,
    vOverC: 0.99,
    gamma: 7,
    focusTotalMs: elapsedFocusMs,
    elapsedFocusMs,
    traveledLy,
    startWallTime,
    endWallTime: startWallTime + elapsedFocusMs,
    originStarId: overrides.originStarId ?? 'hip-sol',
    originCoords: null,
    destStarId,
    destCoords: null,
    snapshot: makeSnapshot({ status, startWallTime, elapsedFocusMs, traveledLy }),
    starsVisitedIds: [],
    createdAt: startWallTime,
    updatedAt: startWallTime + elapsedFocusMs,
  };
  return { ...base, ...overrides };
}

function unlocked(records: readonly VoyageRecord[]): readonly string[] {
  return unlockedAchievementIds(buildAchievementContext(records, END, FACTS));
}

describe('engine/achievements 成就系统（S32，ADR-0016）', () => {
  it('成就目录共 15 个、总点 510，含跃迁授权成就', () => {
    expect(ACHIEVEMENTS).toHaveLength(15);
    expect(ACHIEVEMENT_TOTAL_POINTS).toBe(510);
    expect(getAchievementById('distance-1000')?.grantsEngineTier).toBe('jump');
  });

  it('没有任何记录时全部未解锁', () => {
    expect(unlocked([])).toEqual([]);
  });

  describe('航行里程类（累计距离）', () => {
    it('累计 1 光年解锁「启程」，不足不解锁', () => {
      expect(unlocked([makeRecord({ startWallTime: END, traveledLy: 0.8 })])).not.toContain(
        'distance-1',
      );
      expect(unlocked([makeRecord({ startWallTime: END, traveledLy: 1 })])).toContain('distance-1');
    });

    it('累计 100 光年解锁「远航」，含中止记录里程', () => {
      const records = [
        makeRecord({ startWallTime: END, traveledLy: 60, status: 'completed' }),
        makeRecord({ startWallTime: END, traveledLy: 40, status: 'aborted' }),
      ];
      expect(unlocked(records)).toContain('distance-100');
    });

    it('累计 1000 光年解锁「星河」并授予跃迁引擎', () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeRecord({ startWallTime: atLocalDay(2026, 7, i % 28), traveledLy: 100 }),
      );
      expect(unlocked(records)).toContain('distance-1000');
      const ctx = buildAchievementContext(records, END, FACTS);
      expect(grantedEngineTiers(ctx)).toContain('jump');
    });
  });

  describe('探索发现类', () => {
    it('第一条航行记录（含中止）解锁「初次启航」', () => {
      expect(unlocked([makeRecord({ startWallTime: END, status: 'aborted' })])).toContain(
        'first-voyage',
      );
    });

    it('离开太阳系：目的地非太阳且已航行才解锁', () => {
      const toSun = makeRecord({ startWallTime: END, destStarId: 'hip-sol', traveledLy: 0 });
      expect(unlocked([toSun])).not.toContain('leave-solar-system');
      const freeDrift = makeRecord({ startWallTime: END, destStarId: null, traveledLy: 0.5 });
      expect(unlocked([freeDrift])).toContain('leave-solar-system');
    });

    it('红矮星访客：完成到 M 型星解锁；非 M 型不解锁', () => {
      const toM = makeRecord({ startWallTime: END, destStarId: 'hip-70890' });
      expect(unlocked([toM])).toContain('visit-m-star');
      const toA = makeRecord({ startWallTime: END, destStarId: 'hip-32349' });
      expect(unlocked([toA])).not.toContain('visit-m-star');
    });

    it('开拓者：完成 10 颗不同恒星解锁', () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeRecord({ startWallTime: atLocalDay(2026, 7, i), destStarId: `hip-${90000 + i}` }),
      );
      expect(unlocked(records)).toContain('explore-10');
      expect(unlocked(records.slice(0, 9))).not.toContain('explore-10');
    });
  });

  describe('专注时长类', () => {
    it('首个番茄钟：单次 ≥25 分钟解锁，不足不解锁', () => {
      expect(
        unlocked([makeRecord({ startWallTime: END, elapsedFocusMs: 20 * MS_PER_MINUTE })]),
      ).not.toContain('first-pomodoro');
      expect(
        unlocked([makeRecord({ startWallTime: END, elapsedFocusMs: 25 * MS_PER_MINUTE })]),
      ).toContain('first-pomodoro');
    });

    it('七日连航：连续 7 天专注解锁，6 天不解锁', () => {
      const six = Array.from({ length: 6 }, (_, i) =>
        makeRecord({ startWallTime: atLocalDay(2026, 7, 2 + i) }),
      );
      expect(unlocked(six)).not.toContain('streak-7');
      const seven = [...six, makeRecord({ startWallTime: atLocalDay(2026, 7, 8) })];
      expect(unlocked(seven)).toContain('streak-7');
    });

    it('百时舰长：累计 ≥100 小时解锁', () => {
      const oneMinuteRecords = Array.from({ length: 5999 }, (_, i) =>
        makeRecord({ startWallTime: atLocalDay(2026, 7, i % 28), elapsedFocusMs: MS_PER_MINUTE }),
      );
      expect(unlocked(oneMinuteRecords)).not.toContain('focus-100h');
      const hundredHours = Array.from({ length: 6000 }, (_, i) =>
        makeRecord({ startWallTime: atLocalDay(2026, 7, i % 28), elapsedFocusMs: MS_PER_MINUTE }),
      );
      expect(unlocked(hundredHours)).toContain('focus-100h');
    });
  });

  describe('特殊挑战类', () => {
    it('耐力航行：单次 ≥4 小时解锁，3 小时 59 分不解锁', () => {
      expect(
        unlocked([makeRecord({ startWallTime: END, elapsedFocusMs: 239 * MS_PER_MINUTE })]),
      ).not.toContain('single-focus-4h');
      expect(
        unlocked([makeRecord({ startWallTime: END, elapsedFocusMs: 240 * MS_PER_MINUTE })]),
      ).toContain('single-focus-4h');
    });
  });

  describe('里程碑类', () => {
    it('半人马座征服者：抵达 α Cen A/B 或比邻星任一解锁', () => {
      for (const id of ['hip-71683', 'hip-71681', 'hip-70890']) {
        expect(unlocked([makeRecord({ startWallTime: END, destStarId: id })])).toContain(
          'alpha-centauri',
        );
      }
    });

    it('天狼星访客 / 织女星开拓者：仅完成对应星航行解锁', () => {
      expect(unlocked([makeRecord({ startWallTime: END, destStarId: 'hip-32349' })])).toContain(
        'sirius',
      );
      expect(unlocked([makeRecord({ startWallTime: END, destStarId: 'hip-91262' })])).toContain(
        'vega',
      );
      expect(unlocked([makeRecord({ startWallTime: END, destStarId: 'hip-32349' })])).not.toContain(
        'vega',
      );
    });

    it('中止航行计入里程/专注，但不计入「抵达」类里程碑', () => {
      const aborted = makeRecord({
        startWallTime: END,
        destStarId: 'hip-32349',
        status: 'aborted',
      });
      const ids = unlocked([aborted]);
      expect(ids).toContain('distance-1');
      expect(ids).toContain('first-pomodoro');
      expect(ids).not.toContain('sirius');
    });
  });

  describe('newlyUnlockedAchievementIds 增量（ResultView 播报）', () => {
    it('新增记录只返回本次新解锁的成就', () => {
      const prev = [makeRecord({ startWallTime: END, destStarId: 'hip-70890', status: 'aborted' })];
      const full = [
        ...prev,
        makeRecord({ startWallTime: atLocalDay(2026, 8, 7), destStarId: 'hip-32349' }),
      ];
      const newly = newlyUnlockedAchievementIds(prev, full, END, FACTS);
      expect(newly).toContain('sirius');
      expect(newly).not.toContain('first-voyage');
      expect(newly).not.toContain('leave-solar-system');
    });

    it('首次有记录时增量含全部首航成就', () => {
      const newly = newlyUnlockedAchievementIds(
        [],
        [makeRecord({ startWallTime: END, destStarId: 'hip-70890' })],
        END,
        FACTS,
      );
      expect(newly).toContain('first-voyage');
      expect(newly).toContain('leave-solar-system');
      expect(newly).toContain('visit-m-star');
    });
  });

  it('evaluateAchievements 返回 15 条状态，解锁项与解锁集一致', () => {
    const records = [makeRecord({ startWallTime: END, destStarId: 'hip-70890' })];
    const ctx = buildAchievementContext(records, END, FACTS);
    const states = evaluateAchievements(ctx);
    expect(states).toHaveLength(15);
    expect(states.filter((s) => s.unlocked).map((s) => s.achievement.id)).toEqual(
      unlocked(records),
    );
  });
});
