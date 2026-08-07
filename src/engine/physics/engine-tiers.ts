export type EngineTierId = 'standard' | 'warp-1' | 'warp-2' | 'warp-3' | 'jump';

export type EngineTier = {
  id: EngineTierId;
  name: string;
  gammaMax: number;
  unlockFocusHours: number | null;
};

export const ENGINE_TIERS: readonly EngineTier[] = [
  { id: 'standard', name: '常规引擎', gammaMax: 100_000, unlockFocusHours: null },
  { id: 'warp-1', name: '曲速一级', gammaMax: 400_000, unlockFocusHours: 10 },
  { id: 'warp-2', name: '曲速二级', gammaMax: 1_200_000, unlockFocusHours: 50 },
  { id: 'warp-3', name: '曲速三级', gammaMax: 5_000_000, unlockFocusHours: 200 },
  { id: 'jump', name: '跃迁引擎', gammaMax: 20_000_000, unlockFocusHours: null },
];

export const DEFAULT_ENGINE_TIER: EngineTier = ENGINE_TIERS[0]!;

export function getEngineTierById(id: EngineTierId): EngineTier | undefined {
  return ENGINE_TIERS.find((t) => t.id === id);
}

export function getTierForGamma(gamma: number): EngineTier | null {
  if (!Number.isFinite(gamma) || gamma <= 1) return null;
  return ENGINE_TIERS.find((t) => gamma <= t.gammaMax) ?? null;
}
