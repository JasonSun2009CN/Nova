import { twMerge } from 'tailwind-merge';

import type { AchievementRarity } from '@/engine/achievements/types';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_TOTAL_POINTS } from '@/engine';
import { useAchievements } from '@/components/useAchievements';

function rarityClass(rarity: AchievementRarity): string {
  if (rarity === 'legendary') return 'border-star-gold/60';
  if (rarity === 'rare') return 'border-star-gold/40';
  return 'border-[var(--color-glass-border)]';
}

export function AchievementPanel() {
  const { states, unlockedCount, points } = useAchievements();

  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-2 gap-3">
        <div data-testid="achievement-points" className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[0.6875rem] text-deep-400">成就点数</p>
          <p className="mt-1 font-display text-xl tabular-nums text-star-gold">
            {points}
            <span className="text-sm text-deep-400"> / {ACHIEVEMENT_TOTAL_POINTS}</span>
          </p>
        </div>
        <div data-testid="achievement-unlocked-count" className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[0.6875rem] text-deep-400">已解锁</p>
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
              <span>{category.label}</span>
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
                      {achievement.title}
                    </span>
                    <span
                      className={twMerge(
                        'font-mono text-xs tabular-nums',
                        unlocked ? 'text-star-gold' : 'text-deep-400',
                      )}
                    >
                      {achievement.points} 点
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-deep-400">
                    {achievement.description}
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
