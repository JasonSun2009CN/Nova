import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cartesian3, Star } from '@/engine/contract/catalog-types';
import { STARS_500_FIXTURE } from '@/engine/data/__fixtures__/stars-500';
import { StarCatalog } from '@/engine/data/StarCatalog';

const ORIGIN: Cartesian3 = { xLy: 0, yLy: 0, zLy: 0 };

describe('StarCatalog (数据层 · 纯 TS · 0 React 依赖)', () => {
  let catalog: StarCatalog;

  beforeEach(async () => {
    vi.useFakeTimers();
    catalog = new StarCatalog();
    await catalog.load(STARS_500_FIXTURE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fixture 加载成功：stats.totalStars === 500，太阳 tier0-solar 数量 = 1', () => {
    expect(catalog.size).toBe(500);
    expect(catalog.stats.totalStars).toBe(500);
    expect(catalog.stats.tierCounts['tier0-solar']).toBe(1);
    expect(catalog.findById('hip-sol')?.properName).toBe('太阳');
  });

  it('🌟 太阳最近的恒星：真实邻近排序（Proxima → αCenA/B → 巴纳德星 → Wolf 359 → 拉兰德 → 天狼星）必须正确！', () => {
    const k = 9;
    const nearest = catalog.findNearest(ORIGIN, k);
    expect(nearest).toHaveLength(k);
    const ids = nearest.map((n) => n.point.id);
    // 第 0 名就是太阳本身（0 ly）—— 专注开始时飞船总是从太阳系出发
    expect(ids[0]).toBe('hip-sol');
    expect(Math.sqrt(nearest[0]!.distanceSq)).toBeCloseTo(0, 3);
    // 从第 1 名起：Proxima(4.246)、αCen A / B(4.36)、巴纳德(5.96)
    expect(ids[1]).toBe('hip-70890'); // Proxima Centauri
    const alphaCen = ['hip-71681', 'hip-71682'];
    expect([ids[2], ids[3]].sort()).toEqual(alphaCen);
    expect(ids[4]).toBe('hip-32349'); // 巴纳德星
    expect(ids[5]).toBe('hip-24608'); // Wolf 359
    expect(ids[6]).toBe('hip-3829'); // 拉兰德 21185
    expect(ids[7]).toBe('hip-1475'); // 天狼星 A
    // 距离严格递增
    for (let i = 1; i < nearest.length; i++) {
      expect(Math.sqrt(nearest[i]!.distanceSq)).toBeGreaterThanOrEqual(
        Math.sqrt(nearest[i - 1]!.distanceSq) - 1e-6,
      );
    }
    // Proxima Centauri 4.246 ± 0.01 ly
    expect(Math.sqrt(nearest[1]!.distanceSq)).toBeCloseTo(4.246, 1);
  });

  it('findInRadius(20 ly) 命中所有 20 光年内真实恒星 + 0 假阳性', () => {
    const hits = catalog.findInRadius(ORIGIN, 20);
    const names = new Set(hits.map((h) => h.point.properName));
    expect(names.has('比邻星 Proxima Centauri')).toBe(true);
    expect(names.has('半人马座 α A')).toBe(true);
    expect(names.has('巴纳德星')).toBe(true);
    expect(names.has('沃尔夫 359')).toBe(true);
    expect(names.has('拉兰德 21185')).toBe(true);
    expect(names.has('天狼星 A')).toBe(true);
    expect(names.has('南河三 (小犬座 α Procyon)')).toBe(true);
    expect(names.has('河鼓二 / 牛郎星')).toBe(true);
    for (const h of hits) {
      expect(Math.sqrt(h.distanceSq)).toBeLessThanOrEqual(20 + 1e-6);
    }
  });

  it('按 constellation / spectral / tier 过滤：CEN 半人马座只返回 α Cen A/B + Proxima', () => {
    const cen = catalog.filter({ constellation: 'CEN' });
    expect(cen).toHaveLength(3);
    for (const s of cen) expect(s.constellationIau).toBe('CEN');
    const midK = catalog.filter({ spectral: 'K' });
    for (const s of midK) expect(s.spectral.type).toBe('K');
    const t1 = catalog.filter({ tier: 'tier1-nearby-100ly' });
    for (const s of t1) expect(s.catalogTier).toBe('tier1-nearby-100ly');
    expect(t1.length).toBeGreaterThanOrEqual(10);
  });

  it('apparentMagMax 过滤：仅 vmag ≤ 1 的亮星，结果含天狼/南门二/南河三/织女/五车二/参宿七', () => {
    const bright = catalog.filter({ apparentMagMax: 1 });
    const names = new Set(bright.map((s) => s.properName));
    expect(names.has('天狼星 A')).toBe(true);
    expect(names.has('南河三 (小犬座 α Procyon)')).toBe(true);
    expect(names.has('织女一 (天琴座 α Vega)')).toBe(true);
    expect(names.has('五车二 (御夫座 α)')).toBe(true);
    for (const s of bright) expect(s.apparentMagnitude).toBeLessThanOrEqual(1);
  });

  it('findById / findByHip：hip-sol 和 hip-71681 (αCenA) 可解析', () => {
    expect(catalog.findById('hip-sol')?.id).toBe('hip-sol');
    expect(catalog.findByHip(71681)?.properName).toBe('半人马座 α A');
    expect(catalog.findById('not-exist')).toBeUndefined();
  });

  it('starsForLOD 分桶：每桶恒星互不重叠', () => {
    const buckets = catalog.starsForLOD(ORIGIN, [20, 100, 1000, 10_000]);
    const ids = new Set<string>();
    const addAll = (xs: Star[]) => {
      for (const s of xs) expect(ids.has(s.id)).toBe(false), ids.add(s.id);
    };
    addAll(buckets.close);
    addAll(buckets.mid);
    addAll(buckets.far);
    addAll(buckets.background);
    // 所有距离 ≤ 10000 的恒星都入桶了（背景桶上限 10_000）
    expect(ids.size).toBeGreaterThan(400);
  });

  it('不允许 load 空数组', async () => {
    const c = new StarCatalog();
    await expect(() => c.load([])).rejects.toThrow(RangeError);
  });

  it('findNearest with filter tier=tier0-solar → 仅 1 个结果（太阳）', () => {
    const res = catalog.findNearest(ORIGIN, 100, { tier: 'tier0-solar' });
    expect(res).toHaveLength(1);
    expect(res[0]!.point.id).toBe('hip-sol');
  });

  it('constellations() / nebulae() 默认空数组', () => {
    expect(catalog.constellations()).toEqual([]);
    expect(catalog.nebulae()).toEqual([]);
  });
});
