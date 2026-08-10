import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import { HeatmapGrid } from '@/components/CaptainLog/HeatmapGrid';
import { WeeklyBarChart } from '@/components/CaptainLog/WeeklyBarChart';
import { getDestinationName } from '@/data/destination-stars';
import { aggregateMonthly, aggregateWeekly, buildHeatmap, summarizeCaptainsLog } from '@/engine';
import { useHistoryStore } from '@/store/useHistoryStore';
import { formatDateTime, formatDurationMs, formatFocusEstimate, formatLy } from '@/utils/format';

const MS_PER_MINUTE = 60_000;

function originLabel(starId: string | null): string {
  if (starId == null) return '深空出发';
  if (starId === 'hip-sol') return '太阳系';
  return getDestinationName(starId) ?? '太阳系';
}

export function CaptainLogPanel() {
  const records = useHistoryStore((s) => s.records);
  const loading = useHistoryStore((s) => s.loading);

  const summary = useMemo(() => summarizeCaptainsLog(records, Date.now()), [records]);
  const heatmapCells = useMemo(
    () => buildHeatmap(records, Date.now(), { weekCount: 26 }),
    [records],
  );
  const weekly = useMemo(() => aggregateWeekly(records, Date.now(), { weekCount: 12 }), [records]);
  const monthly = useMemo(
    () => aggregateMonthly(records, Date.now(), { monthCount: 6 }),
    [records],
  );

  if (loading && records.length === 0) {
    return <p className="py-10 text-center text-sm text-deep-400">加载中…</p>;
  }

  if (records.length === 0) {
    return (
      <p className="glass-card rounded-2xl py-10 text-center text-sm text-deep-400">
        还没有航行记录，开启第一次专注吧。
      </p>
    );
  }

  const tiles: readonly { label: string; value: string }[] = [
    {
      label: '总专注时长',
      value: formatFocusEstimate(Math.round(summary.totalFocusMs / MS_PER_MINUTE)),
    },
    { label: '总航行距离', value: formatLy(summary.totalTraveledLy) },
    { label: '已探索恒星', value: `${summary.exploredStarCount} 颗` },
    { label: '完成航行', value: `${summary.completedVoyages} 次` },
  ];

  const recent = records.slice(0, 6);

  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="glass-card rounded-2xl px-4 py-3">
            <p className="text-[0.6875rem] text-deep-400">{tile.label}</p>
            <p className="mt-1 truncate font-display text-xl tabular-nums text-foreground">
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-sm text-deep-400">
        <span>
          最长单次{' '}
          <span className="font-mono tabular-nums text-foreground">
            {formatDurationMs(summary.longestFocusMs)}
          </span>
        </span>
        <span>
          连续专注{' '}
          <span className="font-display tabular-nums text-star-gold">{summary.streakDays} 天</span>
        </span>
      </div>

      <section className="mt-6">
        <h3 className="mb-2 text-xs text-deep-400">专注热力图 · 近 26 周</h3>
        <HeatmapGrid cells={heatmapCells} />
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-xs text-deep-400">周 / 月对比</h3>
        <WeeklyBarChart weekly={weekly} monthly={monthly} />
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-xs text-deep-400">近期航行</h3>
        <ul className="glass-card overflow-hidden rounded-2xl">
          {recent.map((record) => {
            const destName = getDestinationName(record.destStarId);
            const route =
              destName != null
                ? `${originLabel(record.originStarId)} → ${destName}`
                : `${originLabel(record.originStarId)} · 自由漂流`;
            return (
              <li
                key={record.id}
                className="flex items-center gap-3 border-b border-[var(--color-glass-border)] px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm text-foreground tabular-nums">
                      {formatDurationMs(record.elapsedFocusMs)}
                    </span>
                    <span
                      className={twMerge(
                        'text-[0.6875rem]',
                        record.status === 'completed' ? 'text-star-gold' : 'text-star-red',
                      )}
                    >
                      {record.status === 'completed' ? '完成' : '中止'}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-deep-400">
                    {formatDateTime(record.createdAt)} · {route} · {formatLy(record.traveledLy)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
