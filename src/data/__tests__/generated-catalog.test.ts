import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Star } from '@/engine';
import { destinationOptionsFromStars, DESTINATION_STARS } from '@/data/destination-stars';

const STARS_DIR = resolve(process.cwd(), 'public/data/stars');

type Manifest = Readonly<{ sourceVersion: string; totalStars: number; chunks: readonly string[] }>;

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(STARS_DIR, name), 'utf8')) as T;
}

function loadAllStars(): Star[] {
  const manifest = readJson<Manifest>('manifest.json');
  return manifest.chunks.flatMap((id) => readJson<Star[]>(`${id}.json`));
}

describe('生成星表数据完整性 (public/data/stars)', () => {
  it('manifest 与分块数量一致，总星数匹配且 >=5000', () => {
    const manifest = readJson<Manifest>('manifest.json');
    expect(manifest.chunks.length).toBeGreaterThanOrEqual(1);
    expect(manifest.sourceVersion.length).toBeGreaterThan(0);
    let total = 0;
    for (const id of manifest.chunks) {
      const chunk = readJson<Star[]>(`${id}.json`);
      expect(Array.isArray(chunk)).toBe(true);
      total += chunk.length;
    }
    expect(total).toBe(manifest.totalStars);
    expect(manifest.totalStars).toBeGreaterThanOrEqual(5000);
  });

  it('每颗星笛卡尔坐标有限、距离 <=500ly，太阳恰好一个，档位按距离分', () => {
    const stars = loadAllStars();
    let sun = 0;
    let tier1 = 0;
    let tier2 = 0;
    const ids = new Set<string>();
    for (const s of stars) {
      expect(ids.has(s.id), `重复 id ${s.id}`).toBe(false);
      ids.add(s.id);
      const c = s.coords.cartesian;
      expect(Number.isFinite(c.xLy)).toBe(true);
      expect(Number.isFinite(c.yLy)).toBe(true);
      expect(Number.isFinite(c.zLy)).toBe(true);
      const dist = Math.hypot(c.xLy, c.yLy, c.zLy);
      expect(dist).toBeLessThanOrEqual(500.001);
      if (s.id === 'hip-sol') {
        sun++;
        expect(s.properName).toBe('太阳');
        expect(s.catalogTier).toBe('tier0-solar');
        continue;
      }
      if (dist <= 50.001) {
        tier1++;
        expect(s.catalogTier).toBe('tier1-nearby-100ly');
      } else {
        tier2++;
        expect(s.catalogTier).toBe('tier2-bright-mag6');
      }
    }
    expect(sun).toBe(1);
    expect(tier1).toBeGreaterThanOrEqual(900);
    expect(tier2).toBeGreaterThanOrEqual(3000);
  });

  it('织女/天狼/巴纳德 真实距离在预期区间（单位换算守卫）', () => {
    const stars = loadAllStars();
    const byId = new Map(stars.map((s) => [s.id, s] as const));
    const dist = (id: string): number => {
      const s = byId.get(id);
      expect(s, `${id} 缺失`).toBeDefined();
      const c = s!.coords.cartesian;
      return Math.hypot(c.xLy, c.yLy, c.zLy);
    };
    expect(dist('hip-91262')).toBeGreaterThan(24.5); // 织女星 ≈25.05
    expect(dist('hip-91262')).toBeLessThan(25.6);
    expect(dist('hip-32349')).toBeGreaterThan(8.2); // 天狼星 ≈8.6
    expect(dist('hip-32349')).toBeLessThan(9.0);
    expect(dist('hip-87937')).toBeGreaterThan(5.6); // 巴纳德星 ≈5.96
    expect(dist('hip-87937')).toBeLessThan(6.4);
    expect(byId.get('hip-91262')?.properName).toContain('织女');
  });

  it('equatorial.raDeg 存的是角度（0-360），非小时', () => {
    const stars = loadAllStars();
    const vega = stars.find((s) => s.id === 'hip-91262');
    expect(vega).toBeDefined();
    expect(vega!.coords.equatorial.raDeg).toBeGreaterThan(270); // 织女 RA≈279.2°
    expect(vega!.coords.equatorial.raDeg).toBeLessThan(290);
  });

  it('星表在太阳周围大致各向同性（不是单侧扇形）', () => {
    const stars = loadAllStars();
    let sx = 0;
    let sy = 0;
    let sz = 0;
    let count = 0;
    for (const s of stars) {
      const c = s.coords.cartesian;
      const r = Math.hypot(c.xLy, c.yLy, c.zLy);
      if (r < 0.01) continue;
      sx += c.xLy / r;
      sy += c.yLy / r;
      sz += c.zLy / r;
      count++;
    }
    const magnitude = Math.hypot(sx, sy, sz) / count;
    expect(magnitude).toBeLessThan(0.15);
  });

  it('DESTINATION_STARS 每个 id 都存在于目录中', () => {
    const ids = new Set(loadAllStars().map((s) => s.id));
    for (const d of DESTINATION_STARS) {
      expect(ids.has(d.id), `目的地 ${d.id} 不在目录中`).toBe(true);
    }
  });

  it('destinationOptionsFromStars 收录全部 DESTINATION_STARS（目录即目的地唯一数据源）', () => {
    const optionIds = new Set(destinationOptionsFromStars(loadAllStars()).map((o) => o.id));
    for (const d of DESTINATION_STARS) {
      expect(optionIds.has(d.id), `目的地 ${d.id} 应被目录收录`).toBe(true);
    }
  });

  it('抽样校验：13 颗已知恒星距离与参考值偏差在容差内（数据准确性抽查）', () => {
    const stars = loadAllStars();
    const byId = new Map(stars.map((s) => [s.id, s] as const));
    const dist = (id: string): number => {
      const s = byId.get(id);
      expect(s, `${id} 缺失`).toBeDefined();
      const c = s!.coords.cartesian;
      return Math.hypot(c.xLy, c.yLy, c.zLy);
    };
    const sample = [
      { id: 'hip-70890', name: '比邻星', ly: 4.246, tol: 0.06 },
      { id: 'hip-71683', name: '半人马座 α A', ly: 4.36, tol: 0.06 },
      { id: 'hip-71681', name: '半人马座 α B', ly: 4.36, tol: 0.06 },
      { id: 'hip-87937', name: '巴纳德星', ly: 5.963, tol: 0.08 },
      { id: 'gl-406', name: '沃尔夫 359', ly: 7.9, tol: 0.15 },
      { id: 'hip-54035', name: '拉兰德 21185', ly: 8.307, tol: 0.1 },
      { id: 'hip-32349', name: '天狼星', ly: 8.6, tol: 0.1 },
      { id: 'hip-37279', name: '南河三', ly: 11.46, tol: 0.15 },
      { id: 'hip-8102', name: '天仓五', ly: 11.91, tol: 0.15 },
      { id: 'hip-97649', name: '牛郎星', ly: 16.73, tol: 0.2 },
      { id: 'hip-91262', name: '织女星', ly: 25.04, tol: 0.3 },
      { id: 'hip-113368', name: '北落师门', ly: 25.13, tol: 0.3 },
      { id: 'hip-69673', name: '大角星', ly: 36.7, tol: 0.4 },
      { id: 'hip-65474', name: '角宿一', ly: 250, tol: 15 },
      { id: 'hip-30438', name: '老人星', ly: 310, tol: 15 },
    ] as const;
    for (const s of sample) {
      const actual = dist(s.id);
      expect(
        Math.abs(actual - s.ly),
        `${s.name}(${s.id}) 实测 ${actual.toFixed(2)}ly vs 参考 ${s.ly}ly`,
      ).toBeLessThan(s.tol);
    }
  });
});
