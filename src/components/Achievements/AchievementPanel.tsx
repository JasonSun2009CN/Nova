import { twMerge } from 'tailwind-merge';

import type { AchievementRarity } from '@/engine/achievements/types';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_TOTAL_POINTS } from '@/engine';
import { useAchievements } from '@/components/useAchievements';
import { useI18n, type I18nKey } from '@/i18n';

function rarityClass(rarity: AchievementRarity): string {
  if (rarity === 'legendary') return 'border-star-gold/60';
  if (rarity === 'rare') return 'border-star-gold/40';
  return 'border-[var(--color-glass-border)]';
}

function titleKey(id: string): I18nKey {
  return `ach.${id}.title` as I18nKey;
}

function descKey(id: string): I18nKey {
  return `ach.${id}.desc` as I18nKey;
}

function catKey(id: string): I18nKey {
  return `ach.cat.${id}` as I18nKey;
}

export function AchievementPanel() {
  const { t } = useI18n();
  const { states, unlockedCount, points } = useAchievements();

  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-2 gap-3">
        <div data-testid="achievement-points" className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[0.6875rem] text-deep-400">{t('ach.points')}</p>
          <p className="mt-1 font-display text-xl tabular-nums text-star-gold">
            {points}
            <span className="text-sm text-deep-400"> / {ACHIEVEMENT_TOTAL_POINTS}</span>
          </p>
        </div>
        <div data-testid="achievement-unlocked-count" className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[0.6875rem] text-deep-400">{t('ach.unlocked')}</p>
          <p className="mt-1 font-display text-xl tabular-nums text-foreground">
            {unlockedCount}
            <span className="text-sm text-deep-400"> / {states.length}</span>
          </p>
        </div>
      </div>

      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const inCategory = states.filter((s) => s.achievement.category === category.id);
        const unlockedInCategory = inCategory.filter((s) => s.unlocked).length;
        if (inCategory.length === 0) return null;
        return (
          <section key={category.id} className="mt-6">
            <h3 className="mb-2 flex items-baseline justify-between px-1 text-xs text-deep-400">
              <span>{t(catKey(category.id))}</span>
              <span className="tabular-nums">
                {unlockedInCategory}/{inCategory.length}
              </span>
            </h3>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {inCategory.map(({ achievement, unlocked }) => (
                <li
                  key={achievement.id}
                  data-testid={`achievement-${achievement.id}`}
                  data-unlocked={unlocked}
                  className={twMerge(
                    'rounded-xl border bg-[var(--color-glass)] px-3.5 py-3',
                    unlocked
                      ? rarityClass(achievement.rarity)
                      : 'border-[var(--color-glass-border)] opacity-60',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={twMerge(
                        'font-display text-sm',
                        unlocked ? 'text-foreground' : 'text-deep-400',
                      )}
                    >
                      {t(titleKey(achievement.id))}
                    </span>
                    <span
                      className={twMerge(
                        'font-mono text-xs tabular-nums',
                        unlocked ? 'text-star-gold' : 'text-deep-400',
                      )}
                    >
                      {t('ach.pointsUnit', { points: achievement.points })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-deep-400">
                    {t(descKey(achievement.id))}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
