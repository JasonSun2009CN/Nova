import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import { getDestinationName, starDisplayName } from '@/data/destination-stars';
import { resolveEngineTier } from '@/engine';
import type { VoyagePhase } from '@/engine/renderer/warp-flow';
import { useAchievements } from '@/components/useAchievements';
import { useI18n } from '@/i18n';
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl px-2 py-2.5 text-center">
      <div className="font-mono text-base text-foreground tabular-nums">{value}</div>
      <div className="mt-0.5 text-[0.625rem] text-deep-400">{label}</div>
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
  const { t } = useI18n();
  if (destName == null) {
    return (
      <div className="flex w-full items-center justify-between text-sm text-deep-200">
        <span>{t('common.freeDrift')}</span>
        <span className="font-mono text-xs text-deep-400 tabular-nums">
          {t('voyage.traveledLy', { ly: formatLy(traveledLy) })}
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

export function VoyageInstruments({ phase = null }: { phase?: VoyagePhase }) {
  const { t, lang } = useI18n();
  const progress = useVoyageStore((s) => s.progress);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const originStarId = useVoyageStore((s) => s.originStarId);
  const resumedFromSnapshot = useVoyageStore((s) => s.resumedFromSnapshot);
  const pause = useVoyageStore((s) => s.pause);
  const resume = useVoyageStore((s) => s.resume);
  const abort = useVoyageStore((s) => s.abort);
  const catalogStars = useCatalogStore((s) => s.stars);
  const totalFocusHours = useHistoryStore((s) => s.stats?.totalFocusHours ?? 0);
  const { grantedEngineTiers } = useAchievements();

  const originStar = useMemo(
    () => catalogStars.find((s) => s.id === originStarId) ?? null,
    [catalogStars, originStarId],
  );
  const destStar = useMemo(
    () => catalogStars.find((s) => s.id === destStarId) ?? null,
    [catalogStars, destStarId],
  );
  const legLy = useMemo(() => {
    if (originStar == null || destStar == null) return null;
    const A = originStar.coords.cartesian;
    const B = destStar.coords.cartesian;
    return Math.hypot(A.xLy - B.xLy, A.yLy - B.yLy, A.zLy - B.zLy);
  }, [originStar, destStar]);
  const originName = useMemo(() => {
    if (originStarId === 'hip-sol') return t('common.originSolar');
    if (originStar != null) return starDisplayName(originStar);
    return getDestinationName(originStarId) ?? t('common.originSolar');
  }, [originStarId, originStar, t]);
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
  const powerPct = Math.min(
    100,
    (gamma / resolveEngineTier(totalFocusHours, grantedEngineTiers).gammaMax) * 100,
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div className="px-4 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <VoyageProgressGauge
            originName={originName}
            destName={destName}
            fraction={fraction}
            traveledLy={traveledLy}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex w-28 flex-col gap-2 sm:w-36">
          <Metric label={t('voyage.speed')} value={formatVOverC(vOverC)} />
          <Metric label={t('voyage.gamma')} value={formatGamma(gamma)} />
          <Metric label={t('voyage.enginePower')} value={`${powerPct.toFixed(0)}%`} />
        </div>
        <div className="flex w-28 flex-col gap-2 sm:w-36">
          <Metric label={t('voyage.traveled')} value={formatLy(traveledLy)} />
          <Metric
            label={t('voyage.remaining')}
            value={remainingLy != null ? formatLy(remainingLy) : '—'}
          />
          <Metric
            label={t('voyage.eta')}
            value={destStar != null ? formatFocusEstimate(earthRemaining, lang) : '—'}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 px-4 pb-4 sm:px-6">
        <div className="text-center">
          {resumedFromSnapshot && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-star-blue/40 px-3 py-1 text-xs text-star-blue">
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
              {t('voyage.resumed')}
            </div>
          )}
          <div className="font-display text-3xl font-medium leading-none tracking-tight text-foreground tabular-nums sm:text-4xl">
            {formatDurationMs(remaining)}
          </div>
          <div className="mt-2 text-sm text-deep-300">{t('voyage.remainingTime')}</div>
          {status === 'paused' && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-star-gold">
              <span className="h-1 w-1 rounded-full bg-star-gold" aria-hidden="true" />
              {t('voyage.paused')}
            </div>
          )}
          {phase === 'launching' && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-star-gold">
              <span className="h-1 w-1 rounded-full bg-star-gold" aria-hidden="true" />
              {t('voyage.launchingText')}
            </div>
          )}
          {phase === 'arriving' && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-star-gold">
              <span className="h-1 w-1 rounded-full bg-star-gold" aria-hidden="true" />
              {t('voyage.arrivingText')}
            </div>
          )}
          {phase === 'braking' && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-star-red">
              <span className="h-1 w-1 rounded-full bg-star-red" aria-hidden="true" />
              {t('voyage.brakingText')}
            </div>
          )}
          <div className="mt-2 text-xs text-deep-400">
            {t('voyage.timeBoth', {
              ship: formatDurationMs(elapsedFocusMs),
              earth: formatFocusEstimate(earthElapsed, lang),
            })}
          </div>
        </div>

        <div className="pointer-events-auto flex items-stretch gap-3">
          <button
            type="button"
            disabled={transitioning}
            onClick={() => (active ? pause() : resume())}
            className={twMerge(
              'h-14 w-44 rounded-xl font-display text-base font-medium tracking-wider transition-colors duration-200',
              active
                ? 'glass-card text-deep-200 hover:text-foreground'
                : 'bg-star-gold text-[#0a1032] hover:opacity-85',
              transitioning && 'cursor-not-allowed opacity-50',
            )}
          >
            {active ? t('voyage.pause') : t('voyage.resume')}
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
            {t('voyage.end')}
          </button>
        </div>
      </div>
    </div>
  );
}
