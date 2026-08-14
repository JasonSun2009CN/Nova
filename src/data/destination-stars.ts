import type { AppLanguage } from '@/contract/storage-types';
import { cruisePlan, type Star } from '@/engine';

export type DestinationStar = {
  id: string;
  name: string;
  nameEn: string;
  distanceLy: number;
};

const HIP_ID_PATTERN = /^hip(?:-fake)?-(\d+)$/;

export const DESTINATION_STARS: readonly DestinationStar[] = [
  { id: 'hip-sol', name: '太阳', nameEn: 'Sun', distanceLy: 0 },
  {
    id: 'hip-70890',
    name: '比邻星 Proxima Centauri',
    nameEn: 'Proxima Centauri',
    distanceLy: 4.246,
  },
  { id: 'hip-71683', name: '半人马座 α A', nameEn: 'Alpha Centauri A', distanceLy: 4.36 },
  {
    id: 'hip-71681',
    name: '半人马座 α B (Toliman)',
    nameEn: 'Alpha Centauri B (Toliman)',
    distanceLy: 4.36,
  },
  { id: 'hip-87937', name: '巴纳德星', nameEn: "Barnard's Star", distanceLy: 5.963 },
  { id: 'gl-406', name: '沃尔夫 359', nameEn: 'Wolf 359', distanceLy: 7.9 },
  { id: 'hip-54035', name: '拉兰德 21185', nameEn: 'Lalande 21185', distanceLy: 8.307 },
  { id: 'hip-32349', name: '天狼星 A', nameEn: 'Sirius A', distanceLy: 8.6 },
  { id: 'hip-8102', name: '鲸鱼座 τ (天仓五)', nameEn: 'Tau Ceti', distanceLy: 11.91 },
  { id: 'hip-37279', name: '南河三 (小犬座 α Procyon)', nameEn: 'Procyon', distanceLy: 11.46 },
  { id: 'hip-97649', name: '河鼓二 / 牛郎星', nameEn: 'Altair', distanceLy: 16.73 },
  { id: 'hip-91262', name: '织女一 (天琴座 α Vega)', nameEn: 'Vega', distanceLy: 25.04 },
  { id: 'hip-113368', name: '北落师门 (南鱼座 α)', nameEn: 'Fomalhaut', distanceLy: 25.13 },
  { id: 'hip-37826', name: '北河三 (双子座 β Pollux)', nameEn: 'Pollux', distanceLy: 33.72 },
  { id: 'hip-57632', name: '五帝座一 (狮子座 β)', nameEn: 'Denebola', distanceLy: 36 },
  { id: 'hip-69673', name: '贯索增六 / 大角星 (牧夫座 α)', nameEn: 'Arcturus', distanceLy: 36.7 },
  { id: 'hip-24608', name: '五车二 (御夫座 α)', nameEn: 'Capella', distanceLy: 42.9 },
  { id: 'hip-36850', name: '北河二 (双子座 α Castor)', nameEn: 'Castor', distanceLy: 51.6 },
  { id: 'hip-21421', name: '毕宿五 (金牛座 α Aldebaran)', nameEn: 'Aldebaran', distanceLy: 65.3 },
  { id: 'hip-49669', name: '轩辕十四 (狮子座 α Regulus)', nameEn: 'Regulus', distanceLy: 79.3 },
  { id: 'hip-65474', name: '角宿一 (室女座 α Spica)', nameEn: 'Spica', distanceLy: 250 },
  { id: 'hip-30438', name: '老人星 (船底座 α Canopus)', nameEn: 'Canopus', distanceLy: 310 },
];

const EN_NAMES: Readonly<Record<string, string>> = Object.fromEntries(
  DESTINATION_STARS.map((s) => [s.id, s.nameEn]),
);

export function getDestinationName(id: string | null, lang: AppLanguage = 'zh'): string | null {
  if (id == null) return null;
  const hit = DESTINATION_STARS.find((s) => s.id === id);
  if (hit != null) return lang === 'en' ? hit.nameEn : hit.name;
  const match = HIP_ID_PATTERN.exec(id);
  if (match != null) return `HIP ${match[1]!}`;
  return id;
}

export function starDistanceLy(star: Star): number {
  const c = star.coords.cartesian;
  return Math.hypot(c.xLy, c.yLy, c.zLy);
}

export function distanceBetweenStars(a: Star, b: Star): number {
  const A = a.coords.cartesian;
  const B = b.coords.cartesian;
  return Math.hypot(A.xLy - B.xLy, A.yLy - B.yLy, A.zLy - B.zLy);
}

export function destinationOptionsFromStars(stars: readonly Star[]): DestinationStar[] {
  return stars
    .filter((s) => s.properName != null)
    .map((s) => ({
      id: s.id,
      name: starDisplayName(s),
      nameEn: starDisplayName(s, 'en'),
      distanceLy: starDistanceLy(s),
    }))
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
      return {
        id: hit.id,
        name: starDisplayName(hit),
        nameEn: starDisplayName(hit, 'en'),
        distanceLy: starDistanceLy(hit),
      };
    }
  }
  return DESTINATION_STARS.find((s) => s.id === starId) ?? null;
}

export function starDisplayName(star: Star, lang: AppLanguage = 'zh'): string {
  if (lang === 'en') {
    const en = EN_NAMES[star.id];
    if (en != null) return en;
  }
  if (star.properName != null) return star.properName;
  if (star.hipId != null) return `HIP ${star.hipId}`;
  return star.id;
}

export function destinationName(d: DestinationStar, lang: AppLanguage): string {
  return lang === 'en' ? d.nameEn : d.name;
}

export function isSettableDestination(star: Star): boolean {
  return star.properName != null;
}

export function recommendDestination(
  options: readonly DestinationStar[],
  focusMinutes: number,
  gammaMax: number,
): DestinationStar | null {
  if (!(Number.isFinite(gammaMax) && gammaMax > 1)) {
    throw new RangeError('recommendDestination: gammaMax 必须大于 1。');
  }
  const withGamma = options
    .filter((s) => s.distanceLy > 0)
    .map((s) => ({ star: s, gamma: cruisePlan({ focusMinutes, distanceLy: s.distanceLy }).gamma }));
  const reachable = withGamma.filter((r) => r.gamma <= gammaMax);
  if (reachable.length > 0) {
    return reachable.sort((a, b) => b.star.distanceLy - a.star.distanceLy)[0]!.star;
  }
  const nearest = [...withGamma].sort((a, b) => a.star.distanceLy - b.star.distanceLy)[0];
  return nearest?.star ?? null;
}
