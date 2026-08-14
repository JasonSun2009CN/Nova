import { useEffect, useMemo, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { DurationScrubber } from '@/components/DurationScrubber';
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
import { useI18n, type I18nKey } from '@/i18n';
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

const ENGINE_NAME_KEYS: Record<string, I18nKey> = {
  'standard': 'engine.standard',
  'warp-1': 'engine.warp1',
  'warp-2': 'engine.warp2',
  'warp-3': 'engine.warp3',
  'jump': 'engine.jump',
};

function engineNameKey(id: string): I18nKey {
  return ENGINE_NAME_KEYS[id] ?? 'engine.standard';
}

const FOCUS_PRESETS: readonly number[] = [25, 45, 60, 90];

export function SetupPanel() {
  const { t, lang } = useI18n();
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
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between"
    >
      <div className="flex justify-center px-4 pt-4">
        <div className="glass-card max-w-full rounded-2xl px-5 py-3 text-center">
          <h2 className="font-display text-sm font-medium tracking-wide">{t('setup.title')}</h2>
          <p className="mt-1 text-xs text-deep-300">
            {destStar != null
              ? `${originName} → ${destStar.name}`
              : t('setup.fromOrigin', { origin: originName })}
          </p>
          {destStar != null && (
            <p className="mt-0.5 font-mono text-[0.6875rem] text-deep-400 tabular-nums">
              {t('setup.originDist', { ly: formatLy(originSolarLy) })} ·{' '}
              {t('setup.destDist', { ly: formatLy(destSolarLy) })} ·{' '}
              {t('setup.travelDist', { ly: formatLy(legLy) })}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4 sm:px-6">
        {plan != null && !reachable && destStar != null && (
          <div
            data-testid="unreachable-warning"
            className="glass-card rounded-2xl border border-star-red/40 bg-star-red/5 px-4 py-3"
          >
            <p className="text-xs leading-relaxed text-deep-300">
              {t('setup.unreachableTitle', {
                engine: t(engineNameKey(currentEngine.id)),
                gamma: formatGamma(currentEngine.gammaMax),
                time: formatMinuteLabel(minutes, lang),
                dest: destStar.name,
              })}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-deep-400">
              {t('setup.needGamma')}{' '}
              <span className="font-mono text-star-red">{formatGamma(plan.gamma)}</span>
              {upgradeTier != null && (
                <>
                  {' · '}
                  {t('setup.unlock')}{' '}
                  <span className="text-deep-200">{t(engineNameKey(upgradeTier.id))}</span>
                </>
              )}
              {minFocusWithEngine != null && (
                <>
                  {' · '}
                  {t('setup.minFocus')}{' '}
                  <span className="text-deep-200">
                    {formatFocusEstimate(minFocusWithEngine, lang)}
                  </span>
                </>
              )}
            </p>
            {nextUnlock != null && (
              <p className="mt-1 text-xs leading-relaxed text-deep-400">
                {t('setup.upgradePath', {
                  hours: formatFocusEstimate(nextUnlock.hoursRemaining * 60, lang),
                  tier: t(engineNameKey(nextUnlock.tier.id)),
                })}
              </p>
            )}
          </div>
        )}

        <div className="glass-card pointer-events-auto animate-fade-up rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-stretch gap-x-6 gap-y-5">
            <div className="min-w-[260px] flex-1">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="duration-scrubber" className="text-xs text-deep-400">
                  {t('setup.focusLabel')}
                </label>
                <div className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={600}
                    value={minutes}
                    aria-label={t('setup.focusInputAria')}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    className="w-14 appearance-none bg-transparent text-right font-mono text-xl tabular-nums text-foreground focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-[0.6875rem] text-deep-400">{t('setup.minutesUnit')}</span>
                </div>
              </div>
              <DurationScrubber value={minutes} onChange={handleScrub} />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[0.6875rem] text-deep-400">{t('setup.presets')}</span>
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
                        'h-7 cursor-pointer rounded-lg border px-2.5 font-mono text-sm tabular-nums transition-colors duration-200',
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

            <div className="min-w-[200px] flex-1">
              <label htmlFor="dest-star" className="mb-2 block text-xs text-deep-400">
                {t('setup.destLabel')}
              </label>
              <select
                id="dest-star"
                value={destStarId ?? ''}
                onChange={(e) => handleDestChange(e.target.value)}
                className="h-11 w-full cursor-pointer rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 text-base text-foreground focus:border-star-blue focus:outline-none"
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
                  className="mt-2 flex items-center justify-between gap-2"
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
                    className="h-7 shrink-0 cursor-pointer rounded-lg border border-[var(--color-glass-border)] px-3 text-xs text-deep-200 transition-colors duration-200 hover:border-star-gold hover:text-star-gold"
                  >
                    {t('setup.useIt')}
                  </button>
                </div>
              )}
            </div>

            <div className="min-w-[190px] flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-deep-400">
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
                    shipTime: formatMinuteLabel(minutes, lang),
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
                    aria-label={t('setup.speedInputAria')}
                    onChange={(e) => setVOverC(Number(e.target.value))}
                    className="h-11 w-full cursor-pointer accent-[var(--color-star-gold)]"
                  />
                  <p className="mt-1 text-[0.6875rem] text-deep-400">{t('setup.speedHint')}</p>
                </>
              )}
            </div>

            <div data-testid="engine-status" className="min-w-[160px] flex-1 text-xs text-deep-400">
              <div className="mb-2">{t('setup.engineLabel')}</div>
              <span className="inline-block rounded-md border border-star-gold/40 px-1.5 py-0.5 text-xs text-star-gold">
                {t(engineNameKey(currentEngine.id))}
              </span>
              {nextUnlock != null ? (
                <p className="mt-2">
                  {t('setup.nextTier', {
                    name: t(engineNameKey(nextUnlock.tier.id)),
                    hours: formatFocusEstimate(nextUnlock.hoursRemaining * 60, lang),
                  })}
                </p>
              ) : (
                <p className="mt-2">{t('setup.allUnlocked')}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={!valid || !reachable}
              className={twMerge(
                'h-12 w-full flex-none self-end rounded-xl font-display text-base font-medium tracking-wider transition-colors duration-200 sm:w-40',
                valid && reachable
                  ? 'bg-star-gold text-[#0a1032] hover:opacity-85'
                  : 'cursor-not-allowed border border-[var(--color-glass-border)] text-deep-400',
              )}
            >
              {t('setup.start')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
