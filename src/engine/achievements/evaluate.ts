import type { VoyageRecord } from '@/contract/storage-types';
import type { EngineTierId } from '@/engine/physics/engine-tiers';
import { summarizeCaptainsLog } from '@/engine/stats/captains-log';
import { ACHIEVEMENTS } from '@/engine/achievements/catalog';
import type {
  AchievementContext,
  AchievementId,
  AchievementStarFacts,
  AchievementState,
} from '@/engine/achievements/types';

export function buildAchievementContext(
  records: readonly VoyageRecord[],
  endTime: number,
  starFacts: AchievementStarFacts,
): AchievementContext {
  const summary = summarizeCaptainsLog(records, endTime);
  const visitedCompletedDestIds = new Set<string>();
  for (const record of records) {
    if (record.status === 'completed' && record.destStarId != null) {
      visitedCompletedDestIds.add(record.destStarId);
    }
  }
  return { records, endTime, starFacts, summary, visitedCompletedDestIds };
}

export function evaluateAchievements(ctx: AchievementContext): readonly AchievementState[] {
  return ACHIEVEMENTS.map((achievement) => ({
    achievement,
    unlocked: achievement.condition(ctx),
  }));
}

export function unlockedAchievementIds(ctx: AchievementContext): readonly AchievementId[] {
  return evaluateAchievements(ctx)
    .filter((state) => state.unlocked)
    .map((state) => state.achievement.id);
}

export function newlyUnlockedAchievementIds(
  prevRecords: readonly VoyageRecord[],
  fullRecords: readonly VoyageRecord[],
  endTime: number,
  starFacts: AchievementStarFacts,
): readonly AchievementId[] {
  const before = new Set(
    unlockedAchievementIds(buildAchievementContext(prevRecords, endTime, starFacts)),
  );
  return unlockedAchievementIds(buildAchievementContext(fullRecords, endTime, starFacts)).filter(
    (id) => !before.has(id),
  );
}

export function grantedEngineTiers(ctx: AchievementContext): readonly EngineTierId[] {
  const tiers = new Set<EngineTierId>();
  for (const state of evaluateAchievements(ctx)) {
    if (state.unlocked && state.achievement.grantsEngineTier != null) {
      tiers.add(state.achievement.grantsEngineTier);
    }
  }
  return [...tiers];
}
