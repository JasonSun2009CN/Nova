import type { Star } from '@/engine';

export type DestinationStar = {
  id: string;
  name: string;
  distanceLy: number;
};

const HIP_ID_PATTERN = /^hip(?:-fake)?-(\d+)$/;

export const DESTINATION_STARS: readonly DestinationStar[] = [
  { id: 'hip-sol', name: '太阳', distanceLy: 0 },
  { id: 'hip-71681', name: '半人马座 α A', distanceLy: 4.36 },
  { id: 'hip-71682', name: '半人马座 α B (Toliman)', distanceLy: 4.36 },
  { id: 'hip-70890', name: '比邻星 Proxima Centauri', distanceLy: 4.246 },
  { id: 'hip-32349', name: '巴纳德星', distanceLy: 5.963 },
  { id: 'hip-24608', name: '沃尔夫 359', distanceLy: 7.9 },
  { id: 'hip-3829', name: '拉兰德 21185', distanceLy: 8.307 },
  { id: 'hip-1475', name: '天狼星 A', distanceLy: 8.6 },
  { id: 'hip-37826', name: '鲸鱼座 τ (天仓五)', distanceLy: 11.91 },
  { id: 'hip-27989', name: '南河三 (小犬座 α Procyon)', distanceLy: 11.46 },
  { id: 'hip-102098', name: '织女一 (天琴座 α Vega)', distanceLy: 25.04 },
  { id: 'hip-113963', name: '河鼓二 / 牛郎星', distanceLy: 16.73 },
  { id: 'hip-91262', name: '北落师门 (南鱼座 α)', distanceLy: 25.13 },
  { id: 'hip-27366', name: '北河三 (双子座 β Pollux)', distanceLy: 33.72 },
  { id: 'hip-80763', name: '贯索增六 / 大角星 (牧夫座 α)', distanceLy: 36.7 },
  { id: 'hip-45556', name: '五帝座一 (狮子座 β)', distanceLy: 36 },
  { id: 'hip-4472', name: '五车二 (御夫座 α)', distanceLy: 42.9 },
  { id: 'hip-37279', name: '毕宿五 (金牛座 α Aldebaran)', distanceLy: 65.3 },
  { id: 'hip-57632', name: '贯索四 (北冕座 α)', distanceLy: 74 },
  { id: 'hip-62956', name: '开阳 (大熊座 ζ)', distanceLy: 78.2 },
  { id: 'hip-65474', name: '轩辕十四 (狮子座 α)', distanceLy: 79.3 },
  { id: 'hip-68702', name: '北斗七星-玉衡 (大熊座 ε Alioth)', distanceLy: 82.6 },
  { id: 'hip-54061', name: '北斗七星-天玑 (大熊座 γ)', distanceLy: 83.7 },
  { id: 'hip-46853', name: '摇光 (大熊座 η)', distanceLy: 101 },
  { id: 'hip-53910', name: '北斗七星-天枢 (大熊座 α Dubhe)', distanceLy: 124 },
  { id: 'hip-37084', name: '五车五 (御夫座 β / 金牛座 γ)', distanceLy: 131 },
  { id: 'hip-10826', name: '水委一 (波江座 α)', distanceLy: 139 },
  { id: 'hip-49669', name: '角宿一 (室女座 α)', distanceLy: 250 },
  { id: 'hip-85927', name: '心宿二 (天蝎座 α)', distanceLy: 550 },
  { id: 'hip-60718', name: '参宿四 (猎户座 α)', distanceLy: 700 },
  { id: 'hip-9884', name: '参宿七 (猎户座 β)', distanceLy: 860 },
];

export function getDestinationName(id: string | null): string | null {
  if (id == null) return null;
  const hit = DESTINATION_STARS.find((s) => s.id === id);
  if (hit != null) return hit.name;
  const match = HIP_ID_PATTERN.exec(id);
  if (match != null) return `HIP ${match[1]!}`;
  return id;
}

export function starDisplayName(star: Star): string {
  if (star.properName != null) return star.properName;
  if (star.hipId != null) return `HIP ${star.hipId}`;
  return star.id;
}

export function isSettableDestination(star: Star): boolean {
  return star.properName != null;
}
