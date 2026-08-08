import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENGINE_TIER,
  ENGINE_TIERS,
  getEngineTierById,
  getNextUnlock,
  getTierForGamma,
  getUnlockedTier,
  resolveEngineTier,
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

  describe('getUnlockedTier() 按累计专注自动解锁', () => {
    it('0 小时 → 常规引擎（默认）', () => {
      expect(getUnlockedTier(0).id).toBe('standard');
    });

    it('10 小时整 → 曲速一级；差 1 秒仍常规', () => {
      expect(getUnlockedTier(10).id).toBe('warp-1');
      expect(getUnlockedTier(9.99).id).toBe('standard');
    });

    it('50 / 200 小时 → 曲速二 / 三级', () => {
      expect(getUnlockedTier(50).id).toBe('warp-2');
      expect(getUnlockedTier(200).id).toBe('warp-3');
    });

    it('跃迁引擎为里程碑（unlockFocusHours=null），永不因小时解锁', () => {
      expect(getUnlockedTier(10_000).id).toBe('warp-3');
    });

    it('focusHours 非法抛 RangeError', () => {
      expect(() => getUnlockedTier(-1)).toThrow(RangeError);
      expect(() => getUnlockedTier(Number.NaN)).toThrow(RangeError);
    });
  });

  describe('resolveEngineTier() 成就授权引擎档位（S32）', () => {
    it('无授权时与 getUnlockedTier 完全一致（向后兼容）', () => {
      expect(resolveEngineTier(0)).toEqual(getUnlockedTier(0));
      expect(resolveEngineTier(55).id).toBe('warp-2');
      expect(resolveEngineTier(500).id).toBe('warp-3');
      expect(resolveEngineTier(0, [])).toEqual(getUnlockedTier(0));
    });

    it('授权跃迁引擎后直接取最高档，即使专注不足', () => {
      expect(resolveEngineTier(0, ['jump']).id).toBe('jump');
      expect(resolveEngineTier(0, ['jump']).gammaMax).toBe(20_000_000);
    });

    it('授权档低于专注档时不降级', () => {
      expect(resolveEngineTier(55, ['warp-1']).id).toBe('warp-2');
      expect(resolveEngineTier(0, ['standard']).id).toBe('standard');
    });

    it('未知授权 id 忽略，不影响结果', () => {
      // @ts-expect-error - intentionally unknown id
      expect(resolveEngineTier(0, ['nope']).id).toBe('standard');
    });
  });

  describe('getNextUnlock() 升级路径', () => {
    it('0 小时 → 下一级曲速一级，还差 10 小时', () => {
      expect(getNextUnlock(0)).toEqual({ tier: ENGINE_TIERS[1], hoursRemaining: 10 });
    });

    it('累计 30 小时 → 下一级曲速二级，还差 20 小时', () => {
      expect(getNextUnlock(30)).toEqual({ tier: ENGINE_TIERS[2], hoursRemaining: 20 });
    });

    it('已解锁曲速三级 → 无下一级（跃迁为里程碑不列）', () => {
      expect(getNextUnlock(200)).toBeNull();
      expect(getNextUnlock(1000)).toBeNull();
    });

    it('focusHours 非法抛 RangeError', () => {
      expect(() => getNextUnlock(-5)).toThrow(RangeError);
    });
  });
});
