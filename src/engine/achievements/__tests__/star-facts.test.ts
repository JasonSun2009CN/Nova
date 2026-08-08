import { describe, expect, it } from 'vitest';

import type { Star } from '@/engine/contract/catalog-types';
import { BUILTIN_STAR_FACTS, buildAchievementStarFacts } from '@/engine/achievements/star-facts';
import { DESTINATION_STARS } from '@/data/destination-stars';

describe('engine/achievements star-facts 星元数据（S32）', () => {
  it('内置事实覆盖全部 DESTINATION_STARS，含 3 颗 M 型近星', () => {
    for (const dest of DESTINATION_STARS) {
      expect(BUILTIN_STAR_FACTS[dest.id]).toBeDefined();
    }
    expect(BUILTIN_STAR_FACTS['hip-70890']).toBe('M');
    expect(BUILTIN_STAR_FACTS['gl-406']).toBe('M');
    expect(BUILTIN_STAR_FACTS['hip-54035']).toBe('M');
    expect(BUILTIN_STAR_FACTS['hip-sol']).toBe('G');
  });

  it('无目录时 buildAchievementStarFacts 返回内置事实', () => {
    const facts = buildAchievementStarFacts();
    expect(facts.spectralByStarId.get('hip-70890')).toBe('M');
    expect(facts.spectralByStarId.size).toBeGreaterThanOrEqual(DESTINATION_STARS.length);
  });

  it('注入目录星后目录值优先于内置', () => {
    const catalogStars = [
      { id: 'hip-70890', spectral: { type: 'A' as const } },
      { id: 'hip-99999', spectral: { type: 'K' as const } },
    ] as unknown as readonly Star[];
    const facts = buildAchievementStarFacts(catalogStars);
    expect(facts.spectralByStarId.get('hip-70890')).toBe('A');
    expect(facts.spectralByStarId.get('hip-99999')).toBe('K');
    expect(facts.spectralByStarId.get('hip-32349')).toBe('A');
  });
});
