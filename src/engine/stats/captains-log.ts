import type { VoyageRecord } from '@/contract/storage-types';

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export type HeatmapCell = Readonly<{
  dayStartMs: number;
  minutes: number;
  level: HeatmapLevel;
}>;

export type PeriodBucket = Readonly<{
  startMs: number;
  minutes: number;
}>;

export type CaptainsLogSummary = Readonly<{
  totalFocusMs: number;
  totalTraveledLy: number;
  exploredStarCount: number;
  completedVoyages: number;
  totalVoyages: number;
  longestFocusMs: number;
  streakDays: number;
}>;

export const HEATMAP_LEVEL_MINUTES: readonly [number, number, number, number] = [1, 25, 50, 100];

const MS_PER_MINUTE = 60_000;

export function dayStartMs(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function shiftLocalDays(ms: number, days: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

function startOfWeek(ms: number, weekStartsOn: 0 | 1): number {
  const day = dayStartMs(ms);
  const d = new Date(day);
  const offset = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - offset);
  return d.getTime();
}

function focusMinutesByLocalDay(records: readonly VoyageRecord[]): Map<number, number> {
  const byDay = new Map<number, number>();
  for (const record of records) {
    const day = dayStartMs(record.startWallTime);
    const minutes = record.elapsedFocusMs / MS_PER_MINUTE;
    byDay.set(day, (byDay.get(day) ?? 0) + minutes);
  }
  return byDay;
}

function levelForMinutes(minutes: number): HeatmapLevel {
  if (minutes >= HEATMAP_LEVEL_MINUTES[3]) return 4;
  if (minutes >= HEATMAP_LEVEL_MINUTES[2]) return 3;
  if (minutes >= HEATMAP_LEVEL_MINUTES[1]) return 2;
  if (minutes >= HEATMAP_LEVEL_MINUTES[0]) return 1;
  return 0;
}

export function computeStreakDays(records: readonly VoyageRecord[], endTime: number): number {
  const byDay = focusMinutesByLocalDay(records);
  const today = dayStartMs(endTime);
  let cursor = today;
  if ((byDay.get(today) ?? 0) <= 0) {
    cursor = shiftLocalDays(today, -1);
  }
  let streak = 0;
  while ((byDay.get(cursor) ?? 0) > 0) {
    streak += 1;
    cursor = shiftLocalDays(cursor, -1);
  }
  return streak;
}

export function summarizeCaptainsLog(
  records: readonly VoyageRecord[],
  endTime: number,
): CaptainsLogSummary {
  let totalFocusMs = 0;
  let totalTraveledLy = 0;
  let longestFocusMs = 0;
  let completedVoyages = 0;
  const explored = new Set<string>();
  for (const record of records) {
    totalFocusMs += record.elapsedFocusMs;
    totalTraveledLy += record.traveledLy;
    if (record.elapsedFocusMs > longestFocusMs) longestFocusMs = record.elapsedFocusMs;
    if (record.status === 'completed') {
      completedVoyages += 1;
      if (record.destStarId != null) explored.add(record.destStarId);
    }
  }
  return {
    totalFocusMs,
    totalTraveledLy,
    exploredStarCount: explored.size,
    completedVoyages,
    totalVoyages: records.length,
    longestFocusMs,
    streakDays: computeStreakDays(records, endTime),
  };
}

export function buildHeatmap(
  records: readonly VoyageRecord[],
  endTime: number,
  opts: { weekCount?: number; weekStartsOn?: 0 | 1 } = {},
): readonly HeatmapCell[] {
  const weekCount = opts.weekCount ?? 26;
  const weekStartsOn = opts.weekStartsOn ?? 0;
  const byDay = focusMinutesByLocalDay(records);
  const lastColStart = startOfWeek(endTime, weekStartsOn);
  const gridStart = shiftLocalDays(lastColStart, -7 * (weekCount - 1));
  const cells: HeatmapCell[] = [];
  for (let i = 0; i < weekCount * 7; i += 1) {
    const day = shiftLocalDays(gridStart, i);
    const minutes = byDay.get(day) ?? 0;
    cells.push({ dayStartMs: day, minutes, level: levelForMinutes(minutes) });
  }
  return cells;
}

export function aggregateWeekly(
  records: readonly VoyageRecord[],
  endTime: number,
  opts: { weekCount?: number; weekStartsOn?: 0 | 1 } = {},
): readonly PeriodBucket[] {
  const weekCount = opts.weekCount ?? 12;
  const weekStartsOn = opts.weekStartsOn ?? 0;
  const byDay = focusMinutesByLocalDay(records);
  const byWeek = new Map<number, number>();
  for (const [day, minutes] of byDay) {
    const week = startOfWeek(day, weekStartsOn);
    byWeek.set(week, (byWeek.get(week) ?? 0) + minutes);
  }
  const lastWeek = startOfWeek(endTime, weekStartsOn);
  const buckets: PeriodBucket[] = [];
  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const week = shiftLocalDays(lastWeek, -i * 7);
    buckets.push({ startMs: week, minutes: byWeek.get(week) ?? 0 });
  }
  return buckets;
}

export function aggregateMonthly(
  records: readonly VoyageRecord[],
  endTime: number,
  opts: { monthCount?: number } = {},
): readonly PeriodBucket[] {
  const monthCount = opts.monthCount ?? 6;
  const byDay = focusMinutesByLocalDay(records);
  const byMonth = new Map<number, number>();
  for (const [day, minutes] of byDay) {
    const d = new Date(day);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    byMonth.set(monthStart, (byMonth.get(monthStart) ?? 0) + minutes);
  }
  const now = new Date(endTime);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const buckets: PeriodBucket[] = [];
  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const d = new Date(currentMonthStart);
    d.setMonth(d.getMonth() - i);
    buckets.push({ startMs: d.getTime(), minutes: byMonth.get(d.getTime()) ?? 0 });
  }
  return buckets;
}
