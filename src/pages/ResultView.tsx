import { useEffect, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import { getDestinationName } from '@/data/destination-stars';
import { ACHIEVEMENTS, buildAchievementStarFacts, newlyUnlockedAchievementIds } from '@/engine';
import { useI18n, type I18nKey } from '@/i18n';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import { formatDurationMs, formatGamma, formatLy, formatVOverC } from '@/utils/format';

function achievementTitleKey(id: string): I18nKey {
  return `ach.${id}.title` as I18nKey;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-glass-border)] py-3 last:border-b-0">
      <span className="text-sm text-deep-400">{label}</span>
      <span className="font-mono text-sm text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function ResultView() {
  const { t } = useI18n();
  const progress = useVoyageStore((s) => s.progress);
  const originStarId = useVoyageStore((s) => s.originStarId);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const dispose = useVoyageStore((s) => s.dispose);
  const prepare = useVoyageStore((s) => s.prepare);
  const start = useVoyageStore((s) => s.start);
  const records = useHistoryStore((s) => s.records);
  const lastSavedRecord = useVoyageStore((s) => s.lastSavedRecord);
  const catalogStars = useCatalogStore((s) => s.stars);

  useEffect(() => {
    void useCatalogStore.getState().load();
  }, []);

  const newlyUnlockedDefinitions = useMemo(() => {
    if (lastSavedRecord == null || records.length === 0) return [];
    const starFacts = buildAchievementStarFacts(catalogStars);
    const prevRecords = records.filter((record) => record.id !== lastSavedRecord.id);
    return newlyUnlockedAchievementIds(prevRecords, records, Date.now(), starFacts)
      .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
      .filter((a): a is NonNullable<typeof a> => a != null);
  }, [records, lastSavedRecord, catalogStars]);

  if (progress == null) return null;

  const completed = progress.status === 'completed';
  const destName = getDestinationName(destStarId);
  const originName =
    originStarId === 'hip-sol'
      ? t('common.originSolar')
      : (getDestinationName(originStarId) ?? t('common.originSolar'));
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
      className="mx-auto flex w-full max-w-md animate-fade-up flex-col items-stretch gap-5"
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
          {completed ? t('result.completed') : t('result.aborted')}
        </h2>
        <p className="mt-2 text-sm text-deep-400">
          {destName != null
            ? t('result.fromTo', { origin: originName, dest: destName })
            : t('result.freeDrift')}
        </p>
        {newlyUnlockedDefinitions.length > 0 && (
          <div
            data-testid="new-achievements"
            className="mt-4 rounded-xl border border-star-gold/40 bg-star-gold/5 px-4 py-3 text-left"
          >
            <p className="text-xs tracking-wide text-star-gold">{t('result.newAchievements')}</p>
            <ul className="mt-2 space-y-1">
              {newlyUnlockedDefinitions.map((achievement) => (
                <li key={achievement.id} className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-sm text-foreground">
                    {t(achievementTitleKey(achievement.id))}
                  </span>
                  <span className="font-mono text-xs text-star-gold tabular-nums">
                    {achievement.points} {t('result.pointsUnit')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl px-6 py-2">
        <StatRow
          label={t('result.subjectiveTime')}
          value={formatDurationMs(progress.elapsedFocusMs)}
        />
        <StatRow label={t('result.gamma')} value={formatGamma(progress.gamma)} />
        <StatRow label={t('result.speed')} value={formatVOverC(progress.vOverC)} />
        <StatRow label={t('result.travelDistance')} value={formatLy(progress.traveledLy)} />
        <StatRow
          label={t('result.universeTime')}
          value={`${coordinateHours.toFixed(1)} ${t('result.hoursUnit')}`}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRestart}
          className="flex h-14 flex-1 cursor-pointer items-center justify-center rounded-xl bg-star-gold font-display text-base font-medium tracking-wider text-[#0a1032] transition-colors duration-200 hover:opacity-85"
        >
          {t('result.restart')}
        </button>
        <button
          type="button"
          onClick={handleHome}
          className="glass-card flex h-14 w-28 cursor-pointer items-center justify-center rounded-xl text-base text-deep-200 transition-colors duration-200 hover:text-foreground"
        >
          {t('result.backHome')}
        </button>
      </div>
    </section>
  );
}
