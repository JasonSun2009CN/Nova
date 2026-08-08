import { useMemo } from 'react';

import type { EngineTierId } from '@/engine';
import type { AchievementState } from '@/engine/achievements/types';
import { buildAchievementContext, buildAchievementStarFacts, evaluateAchievements } from '@/engine';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useHistoryStore } from '@/store/useHistoryStore';

export type AchievementViewState = {
  states: readonly AchievementState[];
  unlockedCount: number;
  points: number;
  grantedEngineTiers: readonly EngineTierId[];
};

export function useAchievements(): AchievementViewState {
  const records = useHistoryStore((s) => s.records);
  const catalogStars = useCatalogStore((s) => s.stars);
  return useMemo(() => {
    const starFacts = buildAchievementStarFacts(catalogStars);
    const ctx = buildAchievementContext(records, Date.now(), starFacts);
    const states = evaluateAchievements(ctx);
    const unlocked = states.filter((state) => state.unlocked);
    const points = unlocked.reduce((total, state) => total + state.achievement.points, 0);
    const grantedEngineTiers: EngineTierId[] = [];
    for (const state of unlocked) {
      if (state.achievement.grantsEngineTier != null) {
        grantedEngineTiers.push(state.achievement.grantsEngineTier);
      }
    }
    return { states, unlockedCount: unlocked.length, points, grantedEngineTiers };
  }, [records, catalogStars]);
}
