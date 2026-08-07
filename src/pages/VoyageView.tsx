import { lazy, Suspense, useEffect, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import { getDestinationName, starDisplayName } from '@/data/destination-stars';
import { getUnlockedTier } from '@/engine';
import type { VoyagePhase } from '@/engine/renderer/warp-flow';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import {
  formatDurationMs,
  formatFocusEstimate,
  formatGamma,
  formatLy,
  formatVOverC,
} from '@/utils/format';

const VoyageStarField = lazy(() =>
  import('@/engine/renderer/VoyageStarField').then((m) => ({ default: m.VoyageStarField })),
);

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl px-2 py-2.5 text-center">
      <div className="font-mono text-base text-foreground tabular-nums">{value}</div>
      <div className="mt-0.5 text-[10px] text-deep-400">{label}</div>
    </div>
  );
}

function VoyageProgressGauge({
  originName,
  destName,
  fraction,
  traveledLy,
}: {
  originName: string;
  destName: string | null;
  fraction: number | null;
  traveledLy: number;
}) {
  if (destName == null) {
    return (
      <div className="flex w-full items-center justify-between text-sm text-deep-200">
        <span>自由漂流</span>
        <span className="font-mono text-xs text-deep-400 tabular-nums">
          已航行 {formatLy(traveledLy)}
        </span>
      </div>
    );
  }
  const pct = fraction != null ? Math.min(100, Math.max(0, fraction * 100)) : 0;
  return (
    <div data-testid="voyage-progress-gauge" className="w-full">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="max-w-[38%] truncate text-deep-200">{originName}</span>
        <span className="font-mono text-xs text-deep-400 tabular-nums">{pct.toFixed(0)}%</span>
        <span className="max-w-[38%] truncate text-right text-deep-200">{destName}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-star-gold" aria-hidden="true" />
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-star-gold transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-star-gold" aria-hidden="true" />
      </div>
    </div>
  );
}

export function VoyageView({ phase = null }: { phase?: VoyagePhase }) {
  const progress = useVoyageStore((s) => s.progress);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const originStarId = useVoyageStore((s) => s.originStarId);
  const resumedFromSnapshot = useVoyageStore((s) => s.resumedFromSnapshot);
  const pause = useVoyageStore((s) => s.pause);
  const resume = useVoyageStore((s) => s.resume);
  const abort = useVoyageStore((s) => s.abort);
  const catalogStars = useCatalogStore((s) => s.stars);
  const totalFocusHours = useHistoryStore((s) => s.stats?.totalFocusHours ?? 0);

  useEffect(() => {
    void useCatalogStore.getState().load();
  }, []);

  const originStar = useMemo(
    () => catalogStars.find((s) => s.id === originStarId) ?? null,
    [catalogStars, originStarId],
  );
  const destStar = useMemo(
    () => catalogStars.find((s) => s.id === destStarId) ?? null,
    [catalogStars, destStarId],
  );
  const fieldStars = useMemo(
    () => catalogStars.filter((s) => s.id !== originStarId),
    [catalogStars, originStarId],
  );
  const legLy = useMemo(() => {
    if (originStar == null || destStar == null) return null;
    const A = originStar.coords.cartesian;
    const B = destStar.coords.cartesian;
    return Math.hypot(A.xLy - B.xLy, A.yLy - B.yLy, A.zLy - B.zLy);
  }, [originStar, destStar]);
  const originName = useMemo(() => {
    if (originStarId === 'hip-sol') return '太阳系';
    if (originStar != null) return starDisplayName(originStar);
    return getDestinationName(originStarId) ?? '太阳系';
  }, [originStarId, originStar]);
  const destName = useMemo(() => {
    if (destStar != null) return starDisplayName(destStar);
    return getDestinationName(destStarId);
  }, [destStar, destStarId]);

  if (progress == null) return null;

  const status = progress.status;
  const active = status === 'running';
  const transitioning = phase === 'arriving' || phase === 'braking';
  const remaining = progress.remainingFocusMs ?? progress.elapsedFocusMs;
  const elapsedFocusMs = progress.elapsedFocusMs;
  const gamma = progress.gamma;
  const vOverC = progress.vOverC;
  const traveledLy = progress.traveledLy;
  const remainingLy = destStar != null && legLy != null ? Math.max(0, legLy - traveledLy) : null;
  const fraction = destStar != null && legLy != null && legLy > 0 ? traveledLy / legLy : null;
  const earthElapsed = (elapsedFocusMs / 60000) * gamma;
  const earthRemaining = (remaining / 60000) * gamma;
  const powerPct = Math.min(100, (gamma / getUnlockedTier(totalFocusHours).gammaMax) * 100);

  return (
    <section
      data-testid="voyage-view"
      className="relative flex h-full w-full flex-1 animate-fade-up flex-col overflow-hidden"
    >
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(120% 120% at 50% 0%, var(--color-deep-900) 0%, var(--color-deep-950) 58%)',
              }}
            />
          }
        >
          <VoyageStarField
            stars={fieldStars}
            originStar={originStar}
            destStar={destStar}
            gamma={progress.gamma}
            vOverC={progress.vOverC}
            traveledLy={progress.traveledLy}
            legLy={legLy}
            phase={phase}
          />
        </Suspense>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 pb-8 pt-5">
        <VoyageProgressGauge
          originName={originName}
          destName={destName}
          fraction={fraction}
          traveledLy={traveledLy}
        />

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
          {phase === 'launching' && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-star-gold">
              <span className="h-1 w-1 rounded-full bg-star-gold" aria-hidden="true" />
              引擎点火·星光加速…
            </div>
          )}
          {phase === 'arriving' && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-star-gold">
              <span className="h-1 w-1 rounded-full bg-star-gold" aria-hidden="true" />
              正在减速入轨…
            </div>
          )}
          {phase === 'braking' && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-star-red">
              <span className="h-1 w-1 rounded-full bg-star-red" aria-hidden="true" />
              紧急刹车…
            </div>
          )}
          <div className="mt-3 text-xs text-deep-400">
            船上已过 {formatDurationMs(elapsedFocusMs)} · 地球已过{' '}
            {formatFocusEstimate(earthElapsed)}
          </div>
        </div>

        <div className="w-full space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="航行速度" value={formatVOverC(vOverC)} />
            <Metric label="时间膨胀 γ" value={formatGamma(gamma)} />
            <Metric label="已航行距离" value={formatLy(traveledLy)} />
            <Metric label="剩余距离" value={remainingLy != null ? formatLy(remainingLy) : '—'} />
            <Metric
              label="预计到达"
              value={destStar != null ? formatFocusEstimate(earthRemaining) : '—'}
            />
            <Metric label="引擎功率" value={`${powerPct.toFixed(0)}%`} />
          </div>

          <div className="flex items-stretch gap-3">
            <button
              type="button"
              disabled={transitioning}
              onClick={() => (active ? pause() : resume())}
              className={twMerge(
                'h-14 flex-1 rounded-xl font-display text-base font-medium tracking-wider transition-colors duration-200',
                active
                  ? 'glass-card text-deep-200 hover:text-foreground'
                  : 'bg-star-gold text-[#0a1032] hover:opacity-85',
                transitioning && 'cursor-not-allowed opacity-50',
              )}
            >
              {active ? '暂停' : '继续'}
            </button>
            <button
              type="button"
              disabled={transitioning}
              onClick={() => abort()}
              className={twMerge(
                'glass-card h-14 w-28 rounded-xl text-base text-star-red transition-colors duration-200 hover:bg-star-red/10',
                transitioning && 'cursor-not-allowed opacity-50',
              )}
            >
              结束
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
