import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KdTree3, distanceLy3, distanceSq3, type KdPoint3 } from '@/engine/data/KdTree3';

type Pt = KdPoint3 & { id: string };

function pt(x: number, y: number, z: number, id: string): Pt {
  return { x, y, z, id };
}

describe('KdTree3 (3D kd-tree 纯 TS 实现)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('空树 size=0, findNearest 返回空数组', () => {
    const t = KdTree3.build<Pt>([]);
    expect(t.size).toBe(0);
    expect(t.findNearest({ x: 0, y: 0, z: 0 }, 1)).toEqual([]);
    expect(t.rangeSearch({ x: 0, y: 0, z: 0 }, 10)).toEqual([]);
  });

  it('findNearest(k=1) 对于立方体的 8 个顶点，原点最近的是任意 |x|=|y|=|z|=1 的点', () => {
    const verts: Pt[] = [];
    for (const sx of [-1, 1])
      for (const sy of [-1, 1])
        for (const sz of [-1, 1]) verts.push(pt(sx, sy, sz, `${sx}${sy}${sz}`));
    const t = KdTree3.build(verts);
    expect(t.size).toBe(8);
    const [nearest] = t.findNearest({ x: 0, y: 0, z: 0 }, 1);
    expect(nearest).toBeDefined();
    expect(Math.sqrt(nearest!.distanceSq)).toBeCloseTo(Math.sqrt(3), 6);
    expect(Math.abs(nearest!.point.x)).toBe(1);
    expect(Math.abs(nearest!.point.y)).toBe(1);
    expect(Math.abs(nearest!.point.z)).toBe(1);
  });

  it('findNearest(k=3) 返回 3 个最近，严格按距离递增排序；数值 VS brute force 100% 对拍', () => {
    const N = 300;
    const pts: Pt[] = [];
    const rand = mulberry32(42);
    for (let i = 0; i < N; i++) {
      pts.push(pt((rand() - 0.5) * 100, (rand() - 0.5) * 100, (rand() - 0.5) * 100, `p${i}`));
    }
    const t = KdTree3.build(pts);
    expect(t.size).toBe(N);
    const query = { x: 3.1, y: -7.7, z: 11.3 };
    const k = 3;
    const kd = t.findNearest(query, k);
    expect(kd).toHaveLength(k);
    for (let i = 1; i < kd.length; i++) {
      expect(kd[i]!.distanceSq).toBeGreaterThanOrEqual(kd[i - 1]!.distanceSq);
    }
    const brute = pts
      .map((p) => ({ point: p, distanceSq: distanceSq3(query, p) }))
      .sort((a, b) => a.distanceSq - b.distanceSq)
      .slice(0, k);
    for (let i = 0; i < k; i++) {
      expect(kd[i]!.point.id).toBe(brute[i]!.point.id);
      expect(kd[i]!.distanceSq).toBeCloseTo(brute[i]!.distanceSq, 9);
    }
  });

  it('rangeSearch(radius=10) 命中数与 brute force 100% 一致，且结果按距离升序', () => {
    const N = 250;
    const pts: Pt[] = [];
    const rand = mulberry32(7);
    for (let i = 0; i < N; i++) {
      pts.push(pt((rand() - 0.5) * 100, (rand() - 0.5) * 100, (rand() - 0.5) * 100, `p${i}`));
    }
    const t = KdTree3.build(pts);
    const query = { x: 0, y: 0, z: 0 };
    const r = 20;
    const hits = t.rangeSearch(query, r);
    const ids = new Set(hits.map((h) => h.point.id));
    const brute = pts.filter((p) => distanceLy3(query, p) <= r);
    expect(ids.size).toBe(brute.length);
    for (const p of brute) expect(ids.has(p.id)).toBe(true);
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i]!.distanceSq).toBeGreaterThanOrEqual(hits[i - 1]!.distanceSq);
    }
  });

  it('inPlaceRebuild 替换点集，size 和 findNearest 同步更新', () => {
    const t = KdTree3.build([pt(1, 1, 1, 'a'), pt(2, 2, 2, 'b')]);
    expect(t.size).toBe(2);
    t.inPlaceRebuild([pt(0, 0, 0, 'origin'), pt(10, 0, 0, 'far-x')]);
    expect(t.size).toBe(2);
    const [n1] = t.findNearest({ x: 0.1, y: 0, z: 0 }, 1);
    expect(n1!.point.id).toBe('origin');
    t.inPlaceRebuild([]);
    expect(t.size).toBe(0);
  });
});

function mulberry32(a: number) {
  let s = a >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
