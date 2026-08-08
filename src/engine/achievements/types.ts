import type { VoyageRecord } from '@/contract/storage-types';
import type { SpectralType } from '@/engine/contract/catalog-types';
import type { EngineTierId } from '@/engine/physics/engine-tiers';
import type { CaptainsLogSummary } from '@/engine/stats/captains-log';

export type AchievementCategory = 'distance' | 'discovery' | 'focus' | 'special' | 'milestone';

export type AchievementRarity = 'common' | 'rare' | 'legendary';

export type AchievementId =
  | 'distance-1'
  | 'distance-10'
  | 'distance-100'
  | 'distance-1000'
  | 'first-voyage'
  | 'leave-solar-system'
  | 'visit-m-star'
  | 'explore-10'
  | 'first-pomodoro'
  | 'streak-7'
  | 'focus-100h'
  | 'single-focus-4h'
  | 'alpha-centauri'
  | 'sirius'
  | 'vega';

export type AchievementStarFacts = Readonly<{
  spectralByStarId: ReadonlyMap<string, SpectralType>;
}>;

export type AchievementContext = Readonly<{
  records: readonly VoyageRecord[];
  endTime: number;
  starFacts: AchievementStarFacts;
  summary: CaptainsLogSummary;
  visitedCompletedDestIds: ReadonlySet<string>;
}>;

export type AchievementDefinition = Readonly<{
  id: AchievementId;
  category: AchievementCategory;
  title: string;
  description: string;
  points: number;
  rarity: AchievementRarity;
  grantsEngineTier?: EngineTierId;
  condition: (ctx: AchievementContext) => boolean;
}>;

export type AchievementState = Readonly<{
  achievement: AchievementDefinition;
  unlocked: boolean;
}>;
