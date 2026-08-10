import { useEffect, useMemo, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { DurationScrubber } from '@/components/DurationScrubber';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { SoundSettingsPanel } from '@/components/SoundSettingsPanel';
import { useAchievements } from '@/components/useAchievements';
import {
  DESTINATION_STARS,
  destinationOptionsFromStars,
  distanceBetweenStars,
  findDestinationOption,
  recommendDestination,
  starDisplayName,
  starDistanceLy,
} from '@/data/destination-stars';
import {
  LIGHT_SPEED,
  cruisePlan,
  getNextUnlock,
  getTierForGamma,
  lorentzFactor,
  minFocusMinutes,
  resolveEngineTier,
} from '@/engine';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import {
  formatFocusEstimate,
  formatGamma,
  formatLy,
  formatMinuteLabel,
  formatVOverC,
} from '@/utils/format';
import { useI18n } from '@/i18n';

const FOCUS_PRESETS: readonly number[] = [25, 45, 60, 90];

export function SetupPanel() {
  const { t } = useI18n();
  const defaultMinutes = useSettingsStore((s) => s.settings.defaultFocusMinutes);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const defaultVOverC = useSettingsStore((s) => s.settings.defaultVOverC);

  const [minutes, setMinutes] = useState<number>(defaultMinutes);
  const [vOverC, setVOverC] = useState<number>(defaultVOverC);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const currentStarId = useSettingsStore((s) => s.settings.currentStarId) ?? 'hip-sol';
  const catalogStars = useCatalogStore((s) => s.stars);
  const catalogStatus = useCatalogStore((s) => s.status);
  const totalFocusHours = useHistoryStore((s) => s.stats?.totalFocusHours ?? 0);
  const { grantedEngineTiers } = useAchievements();
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
    if (originStarId === 'hip-sol') return t('common.originSolar');
    if (originStar != null) return starDisplayName(originStar);
    return findDestinationOption(originStarId, catalogStars)?.name ?? t('common.originSolar');
  }, [originStarId, originStar, catalogStars, t]);
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
  const currentEngine = useMemo(
    () => resolveEngineTier(totalFocusHours, grantedEngineTiers),
    [totalFocusHours, grantedEngineTiers],
  );
  const nextUnlock = useMemo(() => getNextUnlock(totalFocusHours), [totalFocusHours]);
  const reachable = plan == null || plan.gamma <= currentEngine.gammaMax;
  const upgradeTier =
    plan != null && plan.gamma > currentEngine.gammaMax ? getTierForGamma(plan.gamma) : null;
  const minFocusWithEngine =
    destStar != null && legLy > 0 ? minFocusMinutes(legLy, currentEngine.gammaMax) : null;
  const originOptions = useMemo(() => {
    if (originStar == null) return destinationOptions;
    return destinationOptions.map((d) => {
      const ds = catalogStars.find((s) => s.id === d.id);
      return ds == null ? d : { ...d, distanceLy: distanceBetweenStars(originStar, ds) };
    });
  }, [originStar, destinationOptions, catalogStars]);
  const recommendation = useMemo(
    () =>
      destStar == null || !reachable
        ? recommendDestination(originOptions, minutes, currentEngine.gammaMax)
        : null,
    [destStar, originOptions, minutes, currentEngine, reachable],
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
    if (!valid || !reachable) return;
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
      className="mx-auto flex w-full max-w-md animate-fade-up flex-1 flex-col gap-6 px-6 pb-12 pt-10 lg:mx-0 lg:max-w-none lg:px-0"
    >
      <div>
        <h2 className="font-display text-xl font-medium tracking-wide">{t('setup.title')}</h2>
        <div className="mt-1.5 space-y-1">
          <p className="text-sm text-deep-400">
            {destStar != null
              ? `${originName} → ${destStar.name}`
              : t('setup.fromOrigin', { origin: originName })}
          </p>
          {destStar != null && (
            <p className="font-mono text-xs text-deep-400 tabular-nums">
              {t('setup.originDist', { ly: formatLy(originSolarLy) })} ·{' '}
              {t('setup.destDist', { ly: formatLy(destSolarLy) })} ·{' '}
              {t('setup.travelDist', { ly: formatLy(legLy) })}
            </p>
          )}
        </div>
      </div>

      <div className="glass-card space-y-8 rounded-2xl p-8">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <label htmlFor="duration-scrubber" className="text-sm text-deep-300">
              {t('setup.focusLabel')}
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
              <span className="text-xs text-deep-400">{t('setup.minutesUnit')}</span>
            </div>
          </div>
          <DurationScrubber value={minutes} onChange={handleScrub} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-deep-400">{t('setup.presets')}</span>
            {FOCUS_PRESETS.map((preset) => {
              const active = defaultMinutes === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    touchedRef.current = true;
                    setMinutes(preset);
                    void useSettingsStore
                      .getState()
                      .updateSettings({ defaultFocusMinutes: preset });
                  }}
                  className={twMerge(
                    'h-8 cursor-pointer rounded-lg border px-3 font-mono text-sm tabular-nums transition-colors duration-200',
                    active
                      ? 'border-star-gold text-star-gold'
                      : 'border-[var(--color-glass-border)] text-deep-300 hover:border-star-gold/50 hover:text-foreground',
                  )}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="dest-star" className="mb-3 block text-sm text-deep-300">
            {t('setup.destLabel')}
          </label>
          <select
            id="dest-star"
            value={destStarId ?? ''}
            onChange={(e) => handleDestChange(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 text-base text-foreground focus:border-star-blue focus:outline-none"
          >
            <option value="">{t('setup.noDest')}</option>
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
                {destStar != null && !reachable
                  ? t('setup.unreachablePick')
                  : t('setup.recommendLabel')}
                <span className="text-deep-200">{recommendation.name}</span> ·{' '}
                {formatLy(recommendation.distanceLy)}
              </p>
              <button
                type="button"
                onClick={() => useVoyageStore.getState().selectDestination(recommendation.id)}
                className="h-8 shrink-0 cursor-pointer rounded-lg border border-[var(--color-glass-border)] px-3 text-xs text-deep-200 transition-colors duration-200 hover:border-star-gold hover:text-star-gold"
              >
                {t('setup.useIt')}
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-deep-300">
              {plan != null ? t('setup.speedCalc') : t('setup.speedLabel')}
            </span>
            <span className="font-mono text-sm text-deep-200 tabular-nums">
              {formatVOverC(speed)} · γ {formatGamma(gamma)}
            </span>
          </div>
          {plan != null && destStar != null ? (
            <p className="text-xs leading-relaxed text-deep-400">
              {t('setup.arrivalEstimate', {
                dest: destStar.name,
                shipTime: formatMinuteLabel(minutes),
                earthYears: plan.earthYears.toFixed(1),
              })}
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
              <p className="mt-1 text-xs text-deep-400">{t('setup.speedHint')}</p>
            </>
          )}
        </div>

        <div
          data-testid="engine-status"
          className="flex items-center justify-between border-t border-[var(--color-glass-border)] pt-5"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-deep-300">{t('setup.engineLabel')}</span>
            <span className="rounded-md border border-star-gold/40 px-1.5 py-0.5 text-xs text-star-gold">
              {currentEngine.name}
            </span>
          </div>
          {nextUnlock != null ? (
            <span className="text-xs text-deep-400">
              {t('setup.nextTier', {
                name: nextUnlock.tier.name,
                hours: formatFocusEstimate(nextUnlock.hoursRemaining * 60),
              })}
            </span>
          ) : (
            <span className="text-xs text-deep-400">{t('setup.allUnlocked')}</span>
          )}
        </div>
      </div>

      {plan != null && !reachable && destStar != null && (
        <div
          data-testid="unreachable-warning"
          className="rounded-xl border border-star-red/40 bg-star-red/5 px-4 py-3"
        >
          <p className="text-xs leading-relaxed text-deep-300">
            {t('setup.unreachableTitle', {
              engine: currentEngine.name,
              gamma: formatGamma(currentEngine.gammaMax),
              time: formatMinuteLabel(minutes),
              dest: destStar.name,
            })}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-deep-400">
            {t('setup.needGamma')}{' '}
            <span className="font-mono text-star-red">{formatGamma(plan.gamma)}</span>
            {upgradeTier != null && (
              <>
                {' · '}
                {t('setup.unlock')} <span className="text-deep-200">{upgradeTier.name}</span>
              </>
            )}
            {minFocusWithEngine != null && (
              <>
                {' · '}
                {t('setup.minFocus')}{' '}
                <span className="text-deep-200">{formatFocusEstimate(minFocusWithEngine)}</span>
              </>
            )}
          </p>
          {nextUnlock != null && (
            <p className="mt-1 text-xs leading-relaxed text-deep-400">
              {t('setup.upgradePath', {
                hours: formatFocusEstimate(nextUnlock.hoursRemaining * 60),
                tier: nextUnlock.tier.name,
              })}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleStart}
        disabled={!valid || !reachable}
        className={twMerge(
          'h-14 w-full rounded-xl font-display text-base font-medium tracking-wider transition-colors duration-200',
          valid && reachable
            ? 'bg-star-gold text-[#0a1032] hover:opacity-85'
            : 'cursor-not-allowed border border-[var(--color-glass-border)] text-deep-400',
        )}
      >
        {t('setup.start')}
      </button>

      <SoundSettingsPanel />

      <NotificationSettingsPanel />
    </section>
  );
}
