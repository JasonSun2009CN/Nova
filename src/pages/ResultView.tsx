import { twMerge } from 'tailwind-merge';

import { getDestinationName } from '@/data/destination-stars';
import { useVoyageStore } from '@/store/useVoyageStore';
import { formatDurationMs, formatGamma, formatLy, formatVOverC } from '@/utils/format';

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-glass-border)] py-3 last:border-b-0">
      <span className="text-sm text-deep-400">{label}</span>
      <span className="font-mono text-sm text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function ResultView() {
  const progress = useVoyageStore((s) => s.progress);
  const originStarId = useVoyageStore((s) => s.originStarId);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const dispose = useVoyageStore((s) => s.dispose);
  const prepare = useVoyageStore((s) => s.prepare);
  const start = useVoyageStore((s) => s.start);

  if (progress == null) return null;

  const completed = progress.status === 'completed';
  const destName = getDestinationName(destStarId);
  const originName =
    originStarId === 'hip-sol' ? '太阳系' : (getDestinationName(originStarId) ?? '太阳系');
  const coordinateHours = (progress.elapsedFocusMs * progress.gamma) / (60 * 60 * 1000);

  const handleRestart = () => {
    const restartOrigin = completed
      ? (destStarId ?? originStarId ?? 'hip-sol')
      : (originStarId ?? 'hip-sol');
    prepare({
      focusMinutes: progress.focusTotalMs != null ? progress.focusTotalMs / 60_000 : 25,
      vOverC: progress.vOverC,
      originStarId: restartOrigin,
      destStarId,
    });
    start();
  };

  const handleHome = () => {
    dispose();
  };

  return (
    <section
      data-testid="result-view"
      className="mx-auto flex w-full max-w-md animate-fade-up flex-1 flex-col items-stretch justify-center gap-8 px-6 pb-12 pt-6"
    >
      <div className="text-center">
        <div
          className={twMerge(
            'mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border',
            completed ? 'border-star-gold/40 text-star-gold' : 'border-star-red/40 text-star-red',
          )}
        >
          {completed ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          )}
        </div>
        <h2 className="font-display text-2xl font-medium tracking-wide">
          {completed ? '本次航行完成' : '航行已中止'}
        </h2>
        <p className="mt-2 text-sm text-deep-400">
          {destName != null ? `从 ${originName} 出发，目标 ${destName}` : '本次为自由漂流航行'}
        </p>
      </div>

      <div className="glass-card rounded-2xl px-6 py-2">
        <StatRow label="主观专注时长" value={formatDurationMs(progress.elapsedFocusMs)} />
        <StatRow label="时间膨胀 γ" value={formatGamma(progress.gamma)} />
        <StatRow label="航行速度" value={formatVOverC(progress.vOverC)} />
        <StatRow label="实际航行距离" value={formatLy(progress.traveledLy)} />
        <StatRow label="宇宙时间（客观）" value={`${coordinateHours.toFixed(1)} 小时`} />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRestart}
          className="flex h-14 flex-1 cursor-pointer items-center justify-center rounded-xl bg-star-gold font-display text-base font-medium tracking-wider text-[#0a1032] transition-colors duration-200 hover:opacity-85"
        >
          再来一次
        </button>
        <button
          type="button"
          onClick={handleHome}
          className="glass-card flex h-14 w-28 cursor-pointer items-center justify-center rounded-xl text-base text-deep-200 transition-colors duration-200 hover:text-foreground"
        >
          回到首页
        </button>
      </div>
    </section>
  );
}
