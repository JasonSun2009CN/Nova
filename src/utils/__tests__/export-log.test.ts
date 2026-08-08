import { describe, expect, it } from 'vitest';

import type { VoyageRecord } from '@/contract/storage-types';
import type { VoyageSnapshot, VoyageStatus } from '@/engine/contract/voyage-types';
import { buildVoyageLogMarkdown } from '@/utils/export-log';

const MS_PER_MINUTE = 60_000;

function ts(y: number, mo: number, d: number, h: number, mi: number): number {
  return new Date(y, mo - 1, d, h, mi, 0, 0).getTime();
}

function makeSnapshot(
  status: VoyageStatus,
  startWallTime: number,
  elapsedFocusMs: number,
  traveledLy: number,
): VoyageSnapshot {
  return {
    version: 1,
    createdAt: startWallTime,
    opts: {
      vOverC: 0.99,
      tickIntervalMs: 250,
      infinite: false,
      focusTotalMs: elapsedFocusMs,
    },
    state: {
      status,
      elapsedFocusMs,
      traveledLy,
      startWallTime,
      lastTickWallTime: startWallTime + elapsedFocusMs,
      pausedSegments: [],
      currentPauseStart: null,
    },
  };
}

function makeRecord(overrides: Partial<VoyageRecord>): VoyageRecord {
  const startWallTime = overrides.startWallTime ?? ts(2026, 8, 7, 10, 12);
  const elapsedFocusMs = overrides.elapsedFocusMs ?? 25 * MS_PER_MINUTE;
  const status = overrides.status ?? 'completed';
  const base: VoyageRecord = {
    id: 'voy-1',
    status,
    vOverC: 0.99,
    gamma: 7,
    focusTotalMs: elapsedFocusMs,
    elapsedFocusMs,
    traveledLy: 4.37,
    startWallTime,
    endWallTime: startWallTime + elapsedFocusMs,
    originStarId: 'hip-sol',
    originCoords: null,
    destStarId: 'hip-70890',
    destCoords: null,
    snapshot: makeSnapshot(status, startWallTime, elapsedFocusMs, 4.37),
    starsVisitedIds: [],
    createdAt: startWallTime,
    updatedAt: startWallTime + elapsedFocusMs,
  };
  return { ...base, ...overrides };
}

const END_TIME = ts(2026, 8, 8, 12, 0);

describe('buildVoyageLogMarkdown', () => {
  it('空记录生成标题与表头，摘要显示 0 次航行', () => {
    const md = buildVoyageLogMarkdown([], END_TIME);
    expect(md).toContain('# NOVA 星际旅行经过');
    expect(md).toContain('| # | 日期 | 起点 | 终点 | 专注时长 | 距离 | 状态 |');
    expect(md).toContain('共 0 次航行');
  });

  it('摘要头含次数/总专注/总距离/已探索/连续天数', () => {
    const records = [
      makeRecord({
        startWallTime: ts(2026, 8, 7, 10, 12),
        elapsedFocusMs: 25 * MS_PER_MINUTE,
        traveledLy: 4.37,
      }),
      makeRecord({
        id: 'voy-2',
        startWallTime: ts(2026, 8, 6, 9, 30),
        elapsedFocusMs: 50 * MS_PER_MINUTE,
        traveledLy: 8.6,
        destStarId: 'hip-71683',
      }),
      makeRecord({
        id: 'voy-3',
        status: 'aborted',
        startWallTime: ts(2026, 8, 5, 15, 5),
        elapsedFocusMs: 12 * MS_PER_MINUTE,
        traveledLy: 1.9,
        destStarId: null,
      }),
    ];
    const md = buildVoyageLogMarkdown(records, END_TIME);
    expect(md).toContain('共 3 次航行');
    expect(md).toContain('累计专注 1 小时 27 分');
    expect(md).toContain('累计航行 14.87 光年');
    expect(md).toContain('已探索 2 颗恒星');
    expect(md).toContain('连续专注 3 天');
  });

  it('逐条列出航行：日期、起点→终点、时长、距离、状态', () => {
    const records = [
      makeRecord({
        startWallTime: ts(2026, 8, 7, 10, 12),
        elapsedFocusMs: 25 * MS_PER_MINUTE,
        traveledLy: 4.37,
      }),
      makeRecord({
        id: 'voy-2',
        startWallTime: ts(2026, 8, 6, 9, 30),
        elapsedFocusMs: 50 * MS_PER_MINUTE,
        traveledLy: 8.6,
        destStarId: 'hip-71683',
      }),
    ];
    const md = buildVoyageLogMarkdown(records, END_TIME);
    expect(md).toContain(
      '| 1 | 2026-08-07 10:12 | 太阳系 | 比邻星 Proxima Centauri | 25 分钟 | 4.37 光年 | 完成 |',
    );
    expect(md).toContain(
      '| 2 | 2026-08-06 09:30 | 太阳系 | 半人马座 α A | 50 分钟 | 8.60 光年 | 完成 |',
    );
  });

  it('自由漂流与深空出发使用中文标签，中止标记为中止', () => {
    const records = [
      makeRecord({
        id: 'voy-3',
        status: 'aborted',
        startWallTime: ts(2026, 8, 4, 8, 0),
        elapsedFocusMs: 12 * MS_PER_MINUTE,
        traveledLy: 1.9,
        originStarId: null,
        destStarId: null,
      }),
    ];
    const md = buildVoyageLogMarkdown(records, END_TIME);
    expect(md).toContain(
      '| 1 | 2026-08-04 08:00 | 深空出发 | 自由漂流 | 12 分钟 | 1.90 光年 | 中止 |',
    );
  });
});
