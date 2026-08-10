import type {
  AchievementCategory,
  AchievementDefinition,
  AchievementId,
} from '@/engine/achievements/types';

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;

const ALPHA_CENTAURI_STARS: readonly string[] = ['hip-71683', 'hip-71681', 'hip-70890'];
const SIRIUS_STAR = 'hip-32349';
const VEGA_STAR = 'hip-91262';

export const ACHIEVEMENT_CATEGORIES: readonly { id: AchievementCategory; label: string }[] = [
  { id: 'distance', label: '航行里程' },
  { id: 'discovery', label: '探索发现' },
  { id: 'focus', label: '专注时长' },
  { id: 'special', label: '特殊挑战' },
  { id: 'milestone', label: '里程碑' },
];

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: 'distance-1',
    category: 'distance',
    title: '启程',
    description: '累计航行距离达到 1 光年',
    points: 10,
    rarity: 'common',
    condition: (ctx) => ctx.summary.totalTraveledLy >= 1,
  },
  {
    id: 'distance-10',
    category: 'distance',
    title: '近邻',
    description: '累计航行距离达到 10 光年',
    points: 20,
    rarity: 'common',
    condition: (ctx) => ctx.summary.totalTraveledLy >= 10,
  },
  {
    id: 'distance-100',
    category: 'distance',
    title: '远航',
    description: '累计航行距离达到 100 光年',
    points: 50,
    rarity: 'rare',
    condition: (ctx) => ctx.summary.totalTraveledLy >= 100,
  },
  {
    id: 'distance-1000',
    category: 'distance',
    title: '星河',
    description: '累计航行距离达到 1000 光年，解锁跃迁引擎',
    points: 100,
    rarity: 'legendary',
    grantsEngineTier: 'jump',
    condition: (ctx) => ctx.summary.totalTraveledLy >= 1000,
  },
  {
    id: 'first-voyage',
    category: 'discovery',
    title: '初次启航',
    description: '完成第一次航行',
    points: 10,
    rarity: 'common',
    condition: (ctx) => ctx.records.length >= 1,
  },
  {
    id: 'leave-solar-system',
    category: 'discovery',
    title: '离开太阳系',
    description: '航行驶离太阳系，抵达其他天体或深空',
    points: 15,
    rarity: 'common',
    condition: (ctx) =>
      ctx.records.some((record) => record.traveledLy > 0 && record.destStarId !== 'hip-sol'),
  },
  {
    id: 'visit-m-star',
    category: 'discovery',
    title: '红矮星访客',
    description: '完成航行抵达一颗 M 型红矮星',
    points: 30,
    rarity: 'rare',
    condition: (ctx) => {
      for (const starId of ctx.visitedCompletedDestIds) {
        if (ctx.starFacts.spectralByStarId.get(starId) === 'M') return true;
      }
      return false;
    },
  },
  {
    id: 'explore-10',
    category: 'discovery',
    title: '开拓者',
    description: '探索 10 颗不同的恒星',
    points: 40,
    rarity: 'rare',
    condition: (ctx) => ctx.summary.exploredStarCount >= 10,
  },
  {
    id: 'first-pomodoro',
    category: 'focus',
    title: '首个番茄钟',
    description: '完成一次不少于 25 分钟的专注',
    points: 10,
    rarity: 'common',
    condition: (ctx) => ctx.records.some((record) => record.elapsedFocusMs >= 25 * MS_PER_MINUTE),
  },
  {
    id: 'streak-7',
    category: 'focus',
    title: '七日连航',
    description: '连续专注达到 7 天',
    points: 40,
    rarity: 'rare',
    condition: (ctx) => ctx.summary.streakDays >= 7,
  },
  {
    id: 'focus-100h',
    category: 'focus',
    title: '百时舰长',
    description: '累计专注达到 100 小时',
    points: 60,
    rarity: 'rare',
    condition: (ctx) => ctx.summary.totalFocusMs >= 100 * MS_PER_HOUR,
  },
  {
    id: 'single-focus-4h',
    category: 'special',
    title: '耐力航行',
    description: '单次专注达到 4 小时',
    points: 50,
    rarity: 'rare',
    condition: (ctx) => ctx.records.some((record) => record.elapsedFocusMs >= 240 * MS_PER_MINUTE),
  },
  {
    id: 'alpha-centauri',
    category: 'milestone',
    title: '半人马座征服者',
    description: '完成航行抵达半人马座 α 星系',
    points: 25,
    rarity: 'common',
    condition: (ctx) =>
      ALPHA_CENTAURI_STARS.some((starId) => ctx.visitedCompletedDestIds.has(starId)),
  },
  {
    id: 'sirius',
    category: 'milestone',
    title: '天狼星访客',
    description: '完成航行抵达天狼星',
    points: 25,
    rarity: 'common',
    condition: (ctx) => ctx.visitedCompletedDestIds.has(SIRIUS_STAR),
  },
  {
    id: 'vega',
    category: 'milestone',
    title: '织女星开拓者',
    description: '完成航行抵达织女星',
    points: 25,
    rarity: 'common',
    condition: (ctx) => ctx.visitedCompletedDestIds.has(VEGA_STAR),
  },
];

export function getAchievementById(id: AchievementId): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}

export const ACHIEVEMENT_TOTAL_POINTS: number = ACHIEVEMENTS.reduce(
  (total, achievement) => total + achievement.points,
  0,
);
