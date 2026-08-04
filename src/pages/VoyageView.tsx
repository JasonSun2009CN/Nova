import { twMerge } from 'tailwind-merge';

import { VoyageStarFlow } from '@/components/VoyageStarFlow';
import { getDestinationName } from '@/data/destination-stars';
import { useVoyageStore } from '@/store/useVoyageStore';
import { formatDurationMs, formatGamma, formatLy, formatVOverC } from '@/utils/format';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl px-2 py-2.5 text-center">
      <div className="font-mono text-base text-foreground tabular-nums">{value}</div>
      <div className="mt-0.5 text-[10px] text-deep-400">{label}</div>
    </div>
  );
}

export function VoyageView() {
  const progress = useVoyageStore((s) => s.progress);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const resumedFromSnapshot = useVoyageStore((s) => s.resumedFromSnapshot);
  const pause = useVoyageStore((s) => s.pause);
  const resume = useVoyageStore((s) => s.resume);
  const abort = useVoyageStore((s) => s.abort);

  if (progress == null) return null;

  const status = progress.status;
  const active = status === 'running';
  const remaining = progress.remainingFocusMs ?? progress.elapsedFocusMs;
  const total = progress.focusTotalMs;
  const pct =
    total != null && total > 0 ? Math.min(100, (progress.elapsedFocusMs / total) * 100) : 0;
  const destName = getDestinationName(destStarId);

  return (
    <section
      data-testid="voyage-view"
      className="relative flex h-full w-full flex-1 animate-fade-up flex-col overflow-hidden"
    >
      <div className="absolute inset-0">
        <VoyageStarFlow speed={progress.vOverC} active={active} />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 pb-8 pt-5">
        <div className="flex w-full items-center justify-between">
          <div className="max-w-[70%] truncate text-sm text-deep-200">
            {destName != null ? (
              <>
                <span className="text-star-gold">前往 </span>
                {destName}
              </>
            ) : (
              '自由漂流'
            )}
          </div>
          <div className="font-mono text-xs text-deep-400 tabular-nums">
            已用 {formatDurationMs(progress.elapsedFocusMs)}
          </div>
        </div>

        <div className="text-center">
          {resumedFromSnapshot && (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-star-blue/40 px-3 py-1 text-xs text-star-blue">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 11-2.64-6.36M21 3v6h-6" />
              </svg>
              已恢复上次航行
            </div>
          )}
          <div className="font-display text-[76px] font-medium leading-none tracking-tight text-foreground tabular-nums">
            {formatDurationMs(remaining)}
          </div>
          <div className="mt-4 text-sm text-deep-300">剩余专注时间</div>
          {status === 'paused' && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-star-gold">
              <span className="h-1 w-1 rounded-full bg-star-gold" aria-hidden="true" />
              已暂停
            </div>
          )}
        </div>

        <div className="w-full space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="时间膨胀 γ" value={formatGamma(progress.gamma)} />
            <Metric label="航行速度" value={formatVOverC(progress.vOverC)} />
            <Metric label="已航行距离" value={formatLy(progress.traveledLy)} />
          </div>

          <div
            className="h-1 w-full overflow-hidden rounded-full bg-surface-elevated"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-star-gold transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-stretch gap-3">
            <button
              type="button"
              onClick={() => (active ? pause() : resume())}
              className={twMerge(
                'h-14 flex-1 cursor-pointer rounded-xl font-display text-base font-medium tracking-wider transition-colors duration-200',
                active
                  ? 'glass-card text-deep-200 hover:text-foreground'
                  : 'bg-star-gold text-[#0a1032] hover:opacity-85',
              )}
            >
              {active ? '暂停' : '继续'}
            </button>
            <button
              type="button"
              onClick={() => abort()}
              className="glass-card h-14 w-28 cursor-pointer rounded-xl text-base text-star-red transition-colors duration-200 hover:bg-star-red/10"
            >
              结束
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
