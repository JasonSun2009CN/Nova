import { describe, expect, it } from 'vitest';

import { searchStars } from '@/data/star-search';
import { protoToStar, type ProtoStar } from '@/engine/data/star-mapper';

const VEGA: ProtoStar = {
  id: 'hip-91262',
  properName: '织女一 (天琴座 α Vega)',
  bayer: 'α Lyr',
  flamsteed: '3 Lyr',
  constellation: 'LYR',
  raDeg: 279.23,
  decDeg: 38.78,
  distanceLy: 25.04,
  vMag: 0.03,
  absMag: 0.58,
  spectral: 'A0Va',
  tier: 'tier2-bright-mag6',
};

const SIRIUS: ProtoStar = {
  id: 'hip-32349',
  properName: '天狼星 A (Sirius)',
  bayer: 'α CMa',
  constellation: 'CMA',
  raDeg: 101.29,
  decDeg: -16.72,
  distanceLy: 8.6,
  vMag: -1.46,
  absMag: 1.42,
  spectral: 'A1V',
  tier: 'tier2-bright-mag6',
};

const UNNAMED: ProtoStar = {
  id: 'hip-99999',
  raDeg: 100,
  decDeg: -10,
  distanceLy: 12,
  vMag: 5.5,
  absMag: 4.2,
  spectral: 'G2V',
  tier: 'tier1-nearby-100ly',
};

function stars(): ReturnType<typeof protoToStar>[] {
  return [protoToStar(VEGA), protoToStar(SIRIUS), protoToStar(UNNAMED)];
}

describe('searchStars 星图搜索（常用名 + HIP 编号）', () => {
  it('按中文常用名命中织女星', () => {
    const results = searchStars(stars(), '织女');
    expect(results[0]?.star.id).toBe('hip-91262');
  });

  it('按英文名大小写不敏感命中 Sirius', () => {
    const results = searchStars(stars(), 'sirius');
    expect(results[0]?.star.id).toBe('hip-32349');
  });

  it('按 HIP 编号精确命中', () => {
    const results = searchStars(stars(), '91262');
    expect(results[0]?.star.id).toBe('hip-91262');
  });

  it('按 HIP 编号前缀命中（编号匹配优先于名称包含）', () => {
    const results = searchStars(stars(), '9126');
    expect(results[0]?.star.id).toBe('hip-91262');
  });

  it('按 id 形式 hip-xxx 命中', () => {
    const results = searchStars(stars(), 'hip-32349');
    expect(results[0]?.star.id).toBe('hip-32349');
  });

  it('空查询或无匹配返回空数组', () => {
    expect(searchStars(stars(), '')).toEqual([]);
    expect(searchStars(stars(), '   ')).toEqual([]);
    expect(searchStars(stars(), '不存在的星')).toEqual([]);
  });

  it('结果按距离升序排列（同分时近星优先）', () => {
    const results = searchStars(stars(), 'a');
    expect(results.length).toBeGreaterThan(0);
    const distances = results.map((r) => r.star.coords.cartesian);
    for (let i = 1; i < distances.length; i += 1) {
      const prev = distances[i - 1]!;
      const cur = distances[i]!;
      const dPrev = Math.hypot(prev.xLy, prev.yLy, prev.zLy);
      const dCur = Math.hypot(cur.xLy, cur.yLy, cur.zLy);
      expect(dPrev).toBeLessThanOrEqual(dCur + 1e-9);
    }
  });

  it('limit 限制返回数量', () => {
    const results = searchStars(stars(), 'a', 1);
    expect(results).toHaveLength(1);
  });
});
