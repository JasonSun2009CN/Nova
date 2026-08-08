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

export function getUnlockedTier(focusHours: number): EngineTier {
  if (!Number.isFinite(focusHours) || focusHours < 0) {
    throw new RangeError('getUnlockedTier: focusHours 必须为非负有限数值。');
  }
  let current = DEFAULT_ENGINE_TIER;
  for (const tier of ENGINE_TIERS.slice(1)) {
    if (tier.unlockFocusHours == null) break;
    if (focusHours < tier.unlockFocusHours) break;
    current = tier;
  }
  return current;
}

export function resolveEngineTier(
  focusHours: number,
  grantedTiers: readonly EngineTierId[] = [],
): EngineTier {
  let current = getUnlockedTier(focusHours);
  for (const id of grantedTiers) {
    const tier = getEngineTierById(id);
    if (tier != null && ENGINE_TIERS.indexOf(tier) > ENGINE_TIERS.indexOf(current)) {
      current = tier;
    }
  }
  return current;
}

export function getNextUnlock(focusHours: number): {
  tier: EngineTier;
  hoursRemaining: number;
} | null {
  if (!Number.isFinite(focusHours) || focusHours < 0) {
    throw new RangeError('getNextUnlock: focusHours 必须为非负有限数值。');
  }
  for (const tier of ENGINE_TIERS) {
    if (tier.unlockFocusHours != null && focusHours < tier.unlockFocusHours) {
      return { tier, hoursRemaining: tier.unlockFocusHours - focusHours };
    }
  }
  return null;
}
