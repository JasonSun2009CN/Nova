import type { Star } from '@/engine';
import { starDistanceLy } from '@/data/destination-stars';

export type StarSearchResult = {
  star: Star;
  score: number;
};

function starSearchScore(star: Star, q: string): number {
  const id = star.id.toLowerCase();
  if (id === q) return 100;
  if (star.hipId != null && String(star.hipId) === q) return 95;
  if (/^\d+$/.test(q) && star.hipId != null && String(star.hipId).startsWith(q)) return 90;
  const idNormalized = id.replace(/-/g, ' ');
  if (idNormalized === q) return 100;

  const proper = (star.properName ?? '').toLowerCase();
  if (proper === q) return 85;
  if (proper.startsWith(q)) return 80;
  if (proper.includes(q)) return 70;

  const bayer = (star.bayerName ?? '').toLowerCase();
  if (bayer.includes(q)) return 65;
  const flamsteed = (star.flamsteedName ?? '').toLowerCase();
  if (flamsteed.includes(q)) return 60;
  const constellation = (star.constellationIau ?? '').toLowerCase();
  if (constellation.includes(q)) return 55;
  return 0;
}

export function searchStars(stars: readonly Star[], query: string, limit = 8): StarSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  const results: StarSearchResult[] = [];
  for (const star of stars) {
    const score = starSearchScore(star, q);
    if (score > 0) results.push({ star, score });
  }
  results.sort((a, b) => b.score - a.score || starDistanceLy(a.star) - starDistanceLy(b.star));
  return results.slice(0, limit);
}
