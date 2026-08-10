import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import type { PeriodBucket } from '@/engine/stats/captains-log';

type BarMode = 'week' | 'month';

function bucketLabel(bucket: PeriodBucket, mode: BarMode): string {
  const d = new Date(bucket.startMs);
  if (mode === 'month') return `${d.getMonth() + 1}月`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function WeeklyBarChart({
  weekly,
  monthly,
}: {
  weekly: readonly PeriodBucket[];
  monthly: readonly PeriodBucket[];
}) {
  const [mode, setMode] = useState<BarMode>('week');
  const buckets = mode === 'week' ? weekly : monthly;
  const maxMinutes = Math.max(1, ...buckets.map((b) => b.minutes));
  const peakIndex = buckets.reduce((acc, b, i) => (b.minutes > buckets[acc]!.minutes ? i : acc), 0);

  return (
    <div className="glass-card rounded-2xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.6875rem] text-deep-400">专注柱状图</p>
        <div className="flex rounded-lg border border-[var(--color-glass-border)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('week')}
            className={twMerge(
              'h-7 cursor-pointer rounded-md px-2 transition-colors',
              mode === 'week' ? 'bg-[var(--color-glass)] text-foreground' : 'text-deep-400',
            )}
          >
            周
          </button>
          <button
            type="button"
            onClick={() => setMode('month')}
            className={twMerge(
              'h-7 cursor-pointer rounded-md px-2 transition-colors',
              mode === 'month' ? 'bg-[var(--color-glass)] text-foreground' : 'text-deep-400',
            )}
          >
            月
          </button>
        </div>
      </div>
      <div className="flex h-24 items-end gap-1.5">
        {buckets.map((bucket, i) => (
          <div
            key={bucket.startMs}
            title={`${Math.round(bucket.minutes)} 分钟`}
            className="h-full flex-1 rounded-t"
            style={{
              height: `${Math.max(4, (bucket.minutes / maxMinutes) * 100)}%`,
              background: i === peakIndex ? 'var(--color-star-gold)' : 'rgba(255,215,0,0.35)',
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {buckets.map((bucket) => (
          <span
            key={bucket.startMs}
            className="flex-1 truncate text-center text-[0.5625rem] text-deep-400"
          >
            {bucketLabel(bucket, mode)}
          </span>
        ))}
      </div>
    </div>
  );
}
