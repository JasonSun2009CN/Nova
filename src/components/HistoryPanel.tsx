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
    <section data-testid="history-panel" className="mx-auto w-full max-w-md px-5 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display flex items-center gap-2 text-lg font-semibold tracking-wide">
          <span className="text-star-blue">✦</span>
          <span>航行日志</span>
        </h2>
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
        <p className="py-8 text-center text-sm text-deep-400">加载中…</p>
      ) : records.length === 0 ? (
        <p className="glass-card rounded-2xl py-8 text-center text-sm text-deep-400 shadow-glass">
          还没有航行记录，开启第一次专注吧。
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {records.map((r) => {
            const destName = getDestinationName(r.destStarId);
            return (
              <li
                key={r.id}
                className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 shadow-glass"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground tabular-nums">
                      {formatDurationMs(r.elapsedFocusMs)}
                    </span>
                    <span
                      className={twMerge(
                        'rounded-full px-2 py-0.5 text-[10px]',
                        r.status === 'completed'
                          ? 'bg-star-gold/15 text-star-gold'
                          : 'bg-star-red/15 text-star-red',
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
        <div className="glass-card mt-4 flex flex-wrap gap-x-4 gap-y-1 rounded-2xl px-4 py-3 text-xs text-deep-300 shadow-glass">
          <span>累计专注 {stats.totalFocusHours.toFixed(1)} 小时</span>
          <span>累计航行 {formatLy(stats.totalTraveledLy)}</span>
          <span>完成 {stats.completedVoyages} 次</span>
        </div>
      )}
    </section>
  );
}
