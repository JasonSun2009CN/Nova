import { minFocusMinutes, resolveEngineTier, type Star } from '@/engine';
import { useAchievements } from '@/components/useAchievements';
import { isSettableDestination, starDisplayName } from '@/data/destination-stars';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import {
  formatFocusEstimate,
  formatKelvin,
  formatLy,
  formatMagnitude,
  formatSpectral,
} from '@/utils/format';

type StarInfoCardProps = {
  star: Star;
  onClose: () => void;
  onComplete: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-glass-border)] py-2.5 last:border-b-0">
      <span className="text-xs text-deep-400">{label}</span>
      <span className="font-mono text-sm text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function StarInfoCard({ star, onClose, onComplete }: StarInfoCardProps) {
  const destStarId = useVoyageStore((s) => s.destStarId);
  const totalFocusHours = useHistoryStore((s) => s.stats?.totalFocusHours ?? 0);
  const { grantedEngineTiers } = useAchievements();
  const isDest = destStarId === star.id;
  const settable = isSettableDestination(star);
  const c = star.coords.cartesian;
  const distanceLy = Math.hypot(c.xLy, c.yLy, c.zLy);
  const estimateMinutes =
    distanceLy > 0
      ? minFocusMinutes(distanceLy, resolveEngineTier(totalFocusHours, grantedEngineTiers).gammaMax)
      : null;

  return (
    <div
      data-testid="star-info-card"
      className="glass-card pointer-events-auto w-64 max-w-[calc(100vw-32px)] rounded-2xl p-5 animate-fade-up"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-medium leading-snug text-foreground">
          {starDisplayName(star)}
        </h3>
        <button
          type="button"
          aria-label="关闭信息卡"
          onClick={onClose}
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-deep-400 transition-colors hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <p className="mt-1 text-sm text-deep-300">{formatLy(distanceLy)}</p>
      {settable && estimateMinutes != null && (
        <p className="mt-1 text-xs text-deep-500">
          最短专注 {formatFocusEstimate(estimateMinutes)}
        </p>
      )}

      <div className="mt-3">
        <Stat label="光谱" value={formatSpectral(star.spectral)} />
        <Stat label="视星等" value={`m ${formatMagnitude(star.apparentMagnitude)}`} />
        {star.temperatureKelvin != null && (
          <Stat label="温度" value={formatKelvin(star.temperatureKelvin)} />
        )}
        {star.luminositySol != null && (
          <Stat label="光度" value={`${star.luminositySol.toFixed(2)} L☉`} />
        )}
      </div>

      {settable && (
        <div className="mt-4">
          {isDest ? (
            <div className="flex flex-col gap-2">
              <p className="flex items-center justify-center gap-1.5 text-xs text-star-gold">
                <span className="h-1 w-1 rounded-full bg-star-gold" aria-hidden="true" />
                已设为目的地
              </p>
              <button
                type="button"
                onClick={onComplete}
                className="h-11 w-full cursor-pointer rounded-xl bg-star-gold font-display text-sm font-medium tracking-wider text-[#0a1032] transition-colors duration-200 hover:opacity-85"
              >
                完成
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => useVoyageStore.getState().selectDestination(star.id)}
                className="h-11 w-full cursor-pointer rounded-xl bg-star-gold font-display text-sm font-medium tracking-wider text-[#0a1032] transition-colors duration-200 hover:opacity-85"
              >
                设为目的地
              </button>
              <button
                type="button"
                onClick={onClose}
                className="glass-card h-10 w-full cursor-pointer rounded-xl text-sm text-deep-300 transition-colors duration-200 hover:text-foreground"
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
