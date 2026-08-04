import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Star } from '@/engine';
import { DESTINATION_STARS } from '@/data/destination-stars';

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
  it('manifest 与分块数量一致，总星数匹配且 >=900', () => {
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
    expect(manifest.totalStars).toBeGreaterThanOrEqual(900);
  });

  it('每颗星笛卡尔坐标有限、距离 <=50ly，太阳恰好一个', () => {
    const stars = loadAllStars();
    let sun = 0;
    const ids = new Set<string>();
    for (const s of stars) {
      expect(ids.has(s.id), `重复 id ${s.id}`).toBe(false);
      ids.add(s.id);
      const c = s.coords.cartesian;
      expect(Number.isFinite(c.xLy)).toBe(true);
      expect(Number.isFinite(c.yLy)).toBe(true);
      expect(Number.isFinite(c.zLy)).toBe(true);
      const dist = Math.hypot(c.xLy, c.yLy, c.zLy);
      expect(dist).toBeLessThanOrEqual(50.001);
      if (s.id === 'hip-sol') {
        sun++;
        expect(s.properName).toBe('太阳');
      }
    }
    expect(sun).toBe(1);
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
});
