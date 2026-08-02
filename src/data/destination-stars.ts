export type DestinationStar = {
  id: string;
  name: string;
  distanceLy: number;
};

export const DESTINATION_STARS: readonly DestinationStar[] = [
  { id: 'hip-sol', name: '太阳', distanceLy: 0 },
  { id: 'hip-70890', name: '比邻星 Proxima Centauri', distanceLy: 4.246 },
  { id: 'hip-71681', name: '半人马座 α A', distanceLy: 4.36 },
  { id: 'hip-32349', name: '巴纳德星', distanceLy: 5.963 },
  { id: 'hip-1475', name: '天狼星 A', distanceLy: 8.6 },
  { id: 'hip-102098', name: '织女一 Vega', distanceLy: 25.04 },
];

export function getDestinationName(id: string | null): string | null {
  if (id == null) return null;
  return DESTINATION_STARS.find((s) => s.id === id)?.name ?? null;
}
