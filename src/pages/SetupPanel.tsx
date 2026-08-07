import { useEffect, useMemo, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { DurationScrubber } from '@/components/DurationScrubber';
import {
  DESTINATION_STARS,
  destinationOptionsFromStars,
  distanceBetweenStars,
  findDestinationOption,
  recommendDestination,
  starDisplayName,
  starDistanceLy,
} from '@/data/destination-stars';
import { LIGHT_SPEED, cruisePlan, lorentzFactor } from '@/engine';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import { formatGamma, formatLy, formatMinuteLabel, formatVOverC } from '@/utils/format';

export function SetupPanel() {
  const defaultMinutes = useSettingsStore((s) => s.settings.defaultFocusMinutes);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const defaultVOverC = useSettingsStore((s) => s.settings.defaultVOverC);

  const [minutes, setMinutes] = useState<number>(defaultMinutes);
  const [vOverC, setVOverC] = useState<number>(defaultVOverC);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const currentStarId = useSettingsStore((s) => s.settings.currentStarId) ?? 'hip-sol';
  const catalogStars = useCatalogStore((s) => s.stars);
  const catalogStatus = useCatalogStore((s) => s.status);
  const touchedRef = useRef(false);

  useEffect(() => {
    if (hydrated && !touchedRef.current) {
      setMinutes(defaultMinutes);
    }
  }, [hydrated, defaultMinutes]);

  const valid = Number.isFinite(minutes) && minutes > 0;
  const destinationOptions = useMemo(
    () =>
      catalogStatus === 'ready' && catalogStars.length > 0
        ? destinationOptionsFromStars(catalogStars)
        : [...DESTINATION_STARS],
    [catalogStars, catalogStatus],
  );
  const destStar = useMemo(
    () => findDestinationOption(destStarId, catalogStars),
    [destStarId, catalogStars],
  );
  const originStarId = currentStarId ?? 'hip-sol';
  const originStar = useMemo(
    () => catalogStars.find((s) => s.id === originStarId) ?? null,
    [catalogStars, originStarId],
  );
  const originName = useMemo(() => {
    if (originStarId === 'hip-sol') return '太阳系';
    if (originStar != null) return starDisplayName(originStar);
    return findDestinationOption(originStarId, catalogStars)?.name ?? '太阳系';
  }, [originStarId, originStar, catalogStars]);
  const destStarObj = useMemo(
    () => catalogStars.find((s) => s.id === destStarId) ?? null,
    [catalogStars, destStarId],
  );
  const legLy = useMemo(() => {
    if (originStar != null && destStarObj != null) {
      return distanceBetweenStars(originStar, destStarObj);
    }
    return destStar?.distanceLy ?? 0;
  }, [originStar, destStarObj, destStar]);
  const originSolarLy =
    originStar != null
      ? starDistanceLy(originStar)
      : (findDestinationOption(originStarId, catalogStars)?.distanceLy ?? 0);
  const destSolarLy = destStar?.distanceLy ?? 0;
  const plan = useMemo(
    () =>
      destStar != null && legLy > 0
        ? cruisePlan({ focusMinutes: minutes, distanceLy: legLy })
        : null,
    [destStar, legLy, minutes],
  );
  const gamma = plan?.gamma ?? lorentzFactor(vOverC * LIGHT_SPEED);
  const speed = plan?.vOverC ?? vOverC;
  const originOptions = useMemo(() => {
    if (originStar == null) return destinationOptions;
    return destinationOptions.map((d) => {
      const ds = catalogStars.find((s) => s.id === d.id);
      return ds == null ? d : { ...d, distanceLy: distanceBetweenStars(originStar, ds) };
    });
  }, [originStar, destinationOptions, catalogStars]);
  const recommendation = useMemo(
    () => (destStar == null ? recommendDestination(originOptions, minutes) : null),
    [destStar, originOptions, minutes],
  );

  const handleCustomChange = (raw: string) => {
    touchedRef.current = true;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      setMinutes(Math.round(n));
    }
  };

  const handleScrub = (value: number) => {
    touchedRef.current = true;
    setMinutes(value);
  };

  const handleDestChange = (value: string) => {
    useVoyageStore.getState().selectDestination(value === '' ? null : value);
  };

  const handleStart = () => {
    if (!valid) return;
    useVoyageStore.getState().prepare({
      focusMinutes: minutes,
      vOverC: speed,
      originStarId,
      destStarId,
    });
    useVoyageStore.getState().start();
  };

  return (
    <section
      data-testid="setup-panel"
      className="mx-auto flex w-full max-w-md animate-fade-up flex-1 flex-col gap-6 px-6 pb-12 pt-10"
    >
      <div>
        <h2 className="font-display text-xl font-medium tracking-wide">规划一次星际航行</h2>
        <div className="mt-1.5 space-y-1">
          <p className="text-sm text-deep-400">
            {destStar != null
              ? `${originName} → ${destStar.name}`
              : `设定专注时长，飞船将从 ${originName} 出发`}
          </p>
          {destStar != null && (
            <p className="font-mono text-xs text-deep-500 tabular-nums">
              出发地距太阳 {formatLy(originSolarLy)} · 目的地距太阳 {formatLy(destSolarLy)} ·
              航行距离 {formatLy(legLy)}
            </p>
          )}
        </div>
      </div>

      <div className="glass-card space-y-8 rounded-2xl p-8">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <label htmlFor="duration-scrubber" className="text-sm text-deep-300">
              专注时长
            </label>
            <div className="flex items-baseline gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                value={minutes}
                aria-label="自定义专注时长（分钟）"
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-16 appearance-none bg-transparent text-right font-mono text-2xl tabular-nums text-foreground focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-xs text-deep-400">分钟</span>
            </div>
          </div>
          <DurationScrubber value={minutes} onChange={handleScrub} />
        </div>

        <div>
          <label htmlFor="dest-star" className="mb-3 block text-sm text-deep-300">
            目的地
          </label>
          <select
            id="dest-star"
            value={destStarId ?? ''}
            onChange={(e) => handleDestChange(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 text-base text-foreground focus:border-star-blue focus:outline-none"
          >
            <option value="">（无目的地 · 自由漂流）</option>
            {destinationOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {formatLy(s.distanceLy)}
              </option>
            ))}
          </select>
          {recommendation != null && (
            <div
              data-testid="recommend-destination"
              className="mt-3 flex items-center justify-between gap-2"
            >
              <p className="text-xs text-deep-400">
                推荐目的地：
                <span className="text-deep-200">{recommendation.name}</span> ·{' '}
                {formatLy(recommendation.distanceLy)}
              </p>
              <button
                type="button"
                onClick={() => useVoyageStore.getState().selectDestination(recommendation.id)}
                className="h-8 shrink-0 cursor-pointer rounded-lg border border-[var(--color-glass-border)] px-3 text-xs text-deep-200 transition-colors duration-200 hover:border-star-gold hover:text-star-gold"
              >
                选用
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-deep-300">
              {plan != null ? '航行速度（推算）' : '航行速度'}
            </span>
            <span className="font-mono text-sm text-deep-200 tabular-nums">
              {formatVOverC(speed)} · γ {formatGamma(gamma)}
            </span>
          </div>
          {plan != null && destStar != null ? (
            <p className="text-xs leading-relaxed text-deep-500">
              飞抵 {destStar.name} 时，船上 {formatMinuteLabel(minutes)} ≈ 地球上{' '}
              {plan.earthYears.toFixed(1)} 年。
            </p>
          ) : (
            <>
              <input
                id="v-slider"
                type="range"
                min={0.5}
                max={0.999}
                step={0.001}
                value={vOverC}
                aria-label="航行速度 v/c"
                onChange={(e) => setVOverC(Number(e.target.value))}
                className="h-12 w-full cursor-pointer accent-[var(--color-star-gold)]"
              />
              <p className="mt-1 text-xs text-deep-500">
                速度越接近光速，时间膨胀越明显，航行距离越远。
              </p>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!valid}
        className={twMerge(
          'h-14 w-full rounded-xl font-display text-base font-medium tracking-wider transition-colors duration-200',
          valid
            ? 'bg-star-gold text-[#0a1032] hover:opacity-85'
            : 'cursor-not-allowed border border-[var(--color-glass-border)] text-deep-500',
        )}
      >
        启动航行
      </button>
    </section>
  );
}
