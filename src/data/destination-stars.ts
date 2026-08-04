import type { Star } from '@/engine';

export type DestinationStar = {
  id: string;
  name: string;
  distanceLy: number;
};

const HIP_ID_PATTERN = /^hip(?:-fake)?-(\d+)$/;

export const DESTINATION_STARS: readonly DestinationStar[] = [
  { id: 'hip-sol', name: '太阳', distanceLy: 0 },
  { id: 'hip-70890', name: '比邻星 Proxima Centauri', distanceLy: 4.246 },
  { id: 'hip-71683', name: '半人马座 α A', distanceLy: 4.36 },
  { id: 'hip-71681', name: '半人马座 α B (Toliman)', distanceLy: 4.36 },
  { id: 'hip-87937', name: '巴纳德星', distanceLy: 5.963 },
  { id: 'gl-406', name: '沃尔夫 359', distanceLy: 7.9 },
  { id: 'hip-54035', name: '拉兰德 21185', distanceLy: 8.307 },
  { id: 'hip-32349', name: '天狼星 A', distanceLy: 8.6 },
  { id: 'hip-8102', name: '鲸鱼座 τ (天仓五)', distanceLy: 11.91 },
  { id: 'hip-37279', name: '南河三 (小犬座 α Procyon)', distanceLy: 11.46 },
  { id: 'hip-97649', name: '河鼓二 / 牛郎星', distanceLy: 16.73 },
  { id: 'hip-91262', name: '织女一 (天琴座 α Vega)', distanceLy: 25.04 },
  { id: 'hip-113368', name: '北落师门 (南鱼座 α)', distanceLy: 25.13 },
  { id: 'hip-37826', name: '北河三 (双子座 β Pollux)', distanceLy: 33.72 },
  { id: 'hip-57632', name: '五帝座一 (狮子座 β)', distanceLy: 36 },
  { id: 'hip-69673', name: '贯索增六 / 大角星 (牧夫座 α)', distanceLy: 36.7 },
  { id: 'hip-24608', name: '五车二 (御夫座 α)', distanceLy: 42.9 },
];

export function getDestinationName(id: string | null): string | null {
  if (id == null) return null;
  const hit = DESTINATION_STARS.find((s) => s.id === id);
  if (hit != null) return hit.name;
  const match = HIP_ID_PATTERN.exec(id);
  if (match != null) return `HIP ${match[1]!}`;
  return id;
}

export function starDistanceLy(star: Star): number {
  const c = star.coords.cartesian;
  return Math.hypot(c.xLy, c.yLy, c.zLy);
}

export function destinationOptionsFromStars(stars: readonly Star[]): DestinationStar[] {
  return stars
    .filter((s) => s.properName != null)
    .map((s) => ({ id: s.id, name: starDisplayName(s), distanceLy: starDistanceLy(s) }))
    .sort((a, b) => a.distanceLy - b.distanceLy);
}

export function findDestinationOption(
  starId: string | null,
  catalogStars: readonly Star[],
): DestinationStar | null {
  if (starId == null) return null;
  if (catalogStars.length > 0) {
    const hit = catalogStars.find((s) => s.id === starId);
    if (hit != null) {
      return { id: hit.id, name: starDisplayName(hit), distanceLy: starDistanceLy(hit) };
    }
  }
  return DESTINATION_STARS.find((s) => s.id === starId) ?? null;
}

export function starDisplayName(star: Star): string {
  if (star.properName != null) return star.properName;
  if (star.hipId != null) return `HIP ${star.hipId}`;
  return star.id;
}

export function isSettableDestination(star: Star): boolean {
  return star.properName != null;
}
