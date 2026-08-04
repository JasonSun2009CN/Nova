import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

import { getDestinationName } from '@/data/destination-stars';
import { useHistoryStore } from '@/store/useHistoryStore';
import { formatDateTime, formatDurationMs, formatLy } from '@/utils/format';

export function HistoryPanel() {
  const records = useHistoryStore((s) => s.records);
  const stats = useHistoryStore((s) => s.stats);
  const loading = useHistoryStore((s) => s.loading);
  const load = useHistoryStore((s) => s.load);
  const deleteRecord = useHistoryStore((s) => s.deleteRecord);
  const clearAll = useHistoryStore((s) => s.clearAll);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section data-testid="history-panel" className="mx-auto w-full max-w-md px-6 pb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium tracking-wide">航行日志</h2>
        {records.length > 0 && (
          <button
            type="button"
            onClick={() => void clearAll()}
            className="h-11 cursor-pointer px-2 text-sm text-deep-400 transition-colors hover:text-star-red"
          >
            清空
          </button>
        )}
      </div>

      {loading && records.length === 0 ? (
        <p className="py-10 text-center text-sm text-deep-400">加载中…</p>
      ) : records.length === 0 ? (
        <p className="glass-card rounded-2xl py-10 text-center text-sm text-deep-400">
          还没有航行记录，开启第一次专注吧。
        </p>
      ) : (
        <ul className="glass-card overflow-hidden rounded-2xl">
          {records.map((r) => {
            const destName = getDestinationName(r.destStarId);
            return (
              <li
                key={r.id}
                className="flex items-center gap-3 border-b border-[var(--color-glass-border)] px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm text-foreground tabular-nums">
                      {formatDurationMs(r.elapsedFocusMs)}
                    </span>
                    <span
                      className={twMerge(
                        'text-[11px]',
                        r.status === 'completed' ? 'text-star-gold' : 'text-star-red',
                      )}
                    >
                      {r.status === 'completed' ? '完成' : '中止'}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-deep-400">
                    {formatDateTime(r.createdAt)}
                    {destName != null ? ` · 前往 ${destName}` : ' · 自由漂流'}
                    {' · '}
                    {formatLy(r.traveledLy)}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="删除这条记录"
                  onClick={() => void deleteRecord(r.id)}
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-deep-400 transition-colors hover:text-star-red"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {stats != null && records.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 px-1 text-xs text-deep-400">
          <span>累计专注 {stats.totalFocusHours.toFixed(1)} 小时</span>
          <span>累计航行 {formatLy(stats.totalTraveledLy)}</span>
          <span>完成 {stats.completedVoyages} 次</span>
        </div>
      )}
    </section>
  );
}
