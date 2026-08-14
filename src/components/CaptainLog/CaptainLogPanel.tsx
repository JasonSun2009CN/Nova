import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import { HeatmapGrid } from '@/components/CaptainLog/HeatmapGrid';
import { WeeklyBarChart } from '@/components/CaptainLog/WeeklyBarChart';
import type { AppLanguage } from '@/contract/storage-types';
import { getDestinationName } from '@/data/destination-stars';
import { aggregateMonthly, aggregateWeekly, buildHeatmap, summarizeCaptainsLog } from '@/engine';
import { useI18n, type I18nKey } from '@/i18n';
import { useHistoryStore } from '@/store/useHistoryStore';
import { formatDateTime, formatDurationMs, formatFocusEstimate, formatLy } from '@/utils/format';

const MS_PER_MINUTE = 60_000;

function originLabel(starId: string | null, t: (k: I18nKey) => string, lang: AppLanguage): string {
  if (starId == null) return t('log.deepSpaceOrigin');
  if (starId === 'hip-sol') return t('common.originSolar');
  return getDestinationName(starId, lang) ?? t('common.originSolar');
}

function categoryLabel(
  category: string | null | undefined,
  t: (k: I18nKey) => string,
): string | null {
  if (category == null || category === '') return null;
  if (category === 'work') return t('category.work');
  if (category === 'study') return t('category.study');
  return category;
}

export function CaptainLogPanel({ hideRecent = false }: { hideRecent?: boolean }) {
  const { t, lang } = useI18n();
  const records = useHistoryStore((s) => s.records);
  const loading = useHistoryStore((s) => s.loading);

  const summary = useMemo(() => summarizeCaptainsLog(records, Date.now()), [records]);
  const heatmapCells = useMemo(
    () => buildHeatmap(records, Date.now(), { weekCount: 26 }),
    [records],
  );
  const weekly = useMemo(() => aggregateWeekly(records, Date.now(), { weekCount: 12 }), [records]);
  const monthly = useMemo(
    () => aggregateMonthly(records, Date.now(), { monthCount: 6 }),
    [records],
  );

  if (loading && records.length === 0) {
    return <p className="py-10 text-center text-sm text-deep-400">{t('history.loading')}</p>;
  }

  if (records.length === 0) {
    return (
      <p className="glass-card rounded-2xl py-10 text-center text-sm text-deep-400">
        {t('history.empty')}
      </p>
    );
  }

  const tiles: readonly { label: string; value: string }[] = [
    {
      label: t('log.totalFocus'),
      value: formatFocusEstimate(Math.round(summary.totalFocusMs / MS_PER_MINUTE), lang),
    },
    { label: t('log.totalDistance'), value: formatLy(summary.totalTraveledLy) },
    {
      label: t('log.exploredStars'),
      value: t('log.exploredStarsValue', { count: summary.exploredStarCount }),
    },
    {
      label: t('log.completedVoyages'),
      value: t('log.completedVoyagesValue', { count: summary.completedVoyages }),
    },
  ];

  const recent = records.slice(0, 6);

  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="glass-card rounded-2xl px-4 py-3">
            <p className="text-[0.6875rem] text-deep-400">{tile.label}</p>
            <p className="mt-1 truncate font-display text-xl tabular-nums text-foreground">
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-sm text-deep-400">
        <span>
          {t('log.longest')}{' '}
          <span className="font-mono tabular-nums text-foreground">
            {formatDurationMs(summary.longestFocusMs)}
          </span>
        </span>
        <span>
          {t('log.streak')}{' '}
          <span className="font-display tabular-nums text-star-gold">
            {t('log.daysUnit', { days: summary.streakDays })}
          </span>
        </span>
      </div>

      <section className="mt-6">
        <h3 className="mb-2 text-xs text-deep-400">{t('log.heatmapTitle')}</h3>
        <HeatmapGrid cells={heatmapCells} />
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-xs text-deep-400">{t('log.weekMonthTitle')}</h3>
        <WeeklyBarChart weekly={weekly} monthly={monthly} />
      </section>

      {!hideRecent && (
        <section className="mt-6">
          <h3 className="mb-2 text-xs text-deep-400">{t('log.recentTitle')}</h3>
          <ul className="glass-card overflow-hidden rounded-2xl">
            {recent.map((record) => {
              const destName = getDestinationName(record.destStarId, lang);
              const route =
                destName != null
                  ? `${originLabel(record.originStarId, t, lang)} → ${destName}`
                  : `${originLabel(record.originStarId, t, lang)} · ${t('history.freeDrift')}`;
              return (
                <li
                  key={record.id}
                  className="flex items-center gap-3 border-b border-[var(--color-glass-border)] px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm text-foreground tabular-nums">
                        {formatDurationMs(record.elapsedFocusMs)}
                      </span>
                      <span
                        className={twMerge(
                          'text-[0.6875rem]',
                          record.status === 'completed' ? 'text-star-gold' : 'text-star-red',
                        )}
                      >
                        {record.status === 'completed'
                          ? t('history.completed')
                          : t('history.aborted')}
                      </span>
                      {categoryLabel(record.category, t) != null && (
                        <span className="rounded-md border border-[var(--color-glass-border)] px-1.5 py-0.5 text-[0.625rem] text-deep-300">
                          {categoryLabel(record.category, t)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-deep-400">
                      {formatDateTime(record.createdAt)} · {route} · {formatLy(record.traveledLy)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
