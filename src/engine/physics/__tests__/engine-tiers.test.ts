import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENGINE_TIER,
  ENGINE_TIERS,
  getEngineTierById,
  getTierForGamma,
} from '@/engine/physics/engine-tiers';
import { reachableRadiusLy } from '@/engine/physics/lorentz';

describe('engine/physics/engine-tiers 引擎 γ 分级（ADR-0012）', () => {
  it('ENGINE_TIERS 五档按 γ_max 升序且值对照 ADR 表', () => {
    expect(ENGINE_TIERS.map((t) => t.gammaMax)).toEqual([
      100_000, 400_000, 1_200_000, 5_000_000, 20_000_000,
    ]);
    expect(ENGINE_TIERS.map((t) => t.id)).toEqual([
      'standard',
      'warp-1',
      'warp-2',
      'warp-3',
      'jump',
    ]);
  });

  it('DEFAULT_ENGINE_TIER = 常规引擎，γ_max=10 万', () => {
    expect(DEFAULT_ENGINE_TIER.id).toBe('standard');
    expect(DEFAULT_ENGINE_TIER.name).toBe('常规引擎');
    expect(DEFAULT_ENGINE_TIER.gammaMax).toBe(100_000);
    expect(DEFAULT_ENGINE_TIER.unlockFocusHours).toBeNull();
  });

  it('各档 25 分钟可达半径对照 ADR 表（~4.8 / ~19 / ~57 / ~238 / ~951ly）', () => {
    for (const tier of ENGINE_TIERS) {
      const radius = reachableRadiusLy(tier.gammaMax, 25);
      expect(radius).toBeGreaterThan(0);
    }
    expect(reachableRadiusLy(ENGINE_TIERS[0]!.gammaMax, 25)).toBeCloseTo(4.75, 1);
    expect(reachableRadiusLy(ENGINE_TIERS[1]!.gammaMax, 25)).toBeCloseTo(19.0, 1);
    expect(reachableRadiusLy(ENGINE_TIERS[2]!.gammaMax, 25)).toBeCloseTo(57.0, 1);
    expect(reachableRadiusLy(ENGINE_TIERS[3]!.gammaMax, 25)).toBeCloseTo(237.7, 0);
    expect(reachableRadiusLy(ENGINE_TIERS[4]!.gammaMax, 25)).toBeCloseTo(950.7, 0);
  });

  it('曲速档解锁条件为累计专注小时数；跃迁档为里程碑（unlockFocusHours=null）', () => {
    expect(ENGINE_TIERS[1]!.unlockFocusHours).toBe(10);
    expect(ENGINE_TIERS[2]!.unlockFocusHours).toBe(50);
    expect(ENGINE_TIERS[3]!.unlockFocusHours).toBe(200);
    expect(ENGINE_TIERS[4]!.unlockFocusHours).toBeNull();
  });

  it('getEngineTierById 命中返回档位、未知 id 返回 undefined', () => {
    expect(getEngineTierById('warp-2')?.name).toBe('曲速二级');
    expect(getEngineTierById('jump')?.gammaMax).toBe(20_000_000);
    // @ts-expect-error - intentionally unknown id
    expect(getEngineTierById('nope')).toBeUndefined();
  });

  it('getTierForGamma 找到能容纳所需 γ 的最早档位', () => {
    expect(getTierForGamma(90_000)?.id).toBe('standard');
    expect(getTierForGamma(100_000)?.id).toBe('standard');
    expect(getTierForGamma(100_001)?.id).toBe('warp-1');
    expect(getTierForGamma(526_000)?.id).toBe('warp-2');
    expect(getTierForGamma(20_000_000)?.id).toBe('jump');
    expect(getTierForGamma(20_000_001)).toBeNull();
    expect(getTierForGamma(1)).toBeNull();
    expect(getTierForGamma(Number.NaN)).toBeNull();
  });
});
