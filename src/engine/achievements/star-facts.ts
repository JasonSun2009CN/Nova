import type { Star, SpectralType } from '@/engine/contract/catalog-types';
import type { AchievementStarFacts } from '@/engine/achievements/types';

export const BUILTIN_STAR_FACTS: Readonly<Record<string, SpectralType>> = {
  'hip-sol': 'G',
  'hip-70890': 'M',
  'hip-71683': 'G',
  'hip-71681': 'K',
  'hip-87937': '?',
  'gl-406': 'M',
  'hip-54035': 'M',
  'hip-32349': 'A',
  'hip-8102': 'G',
  'hip-37279': 'F',
  'hip-97649': 'A',
  'hip-91262': 'A',
  'hip-113368': 'A',
  'hip-37826': 'K',
  'hip-57632': 'A',
  'hip-69673': 'K',
  'hip-24608': 'M',
  'hip-36850': 'A',
  'hip-21421': 'K',
  'hip-49669': 'B',
  'hip-65474': 'B',
  'hip-30438': 'A',
};

export function buildAchievementStarFacts(catalogStars?: readonly Star[]): AchievementStarFacts {
  const spectralByStarId = new Map<string, SpectralType>(Object.entries(BUILTIN_STAR_FACTS));
  if (catalogStars != null) {
    for (const star of catalogStars) {
      spectralByStarId.set(star.id, star.spectral.type);
    }
  }
  return { spectralByStarId };
}
