import type {
  Cartesian3,
  CatalogStats,
  CatalogTier,
  ConstellationIauCode,
  Constellation,
  Nebula,
  SpectralType,
  Star,
} from '@/engine/contract/catalog-types';
import {
  KdTree3,
  distanceLy3,
  type FindNearestResult as KdFindNearestResult,
} from '@/engine/data/KdTree3';

type CatalogPoint = Star & { x: number; y: number; z: number };

export type StarNearestHit = Readonly<{ point: Star; distanceSq: number }>;

export type StarFilter = Partial<{
  tier: CatalogTier | readonly CatalogTier[];
  spectral: SpectralType | readonly SpectralType[];
  constellation: ConstellationIauCode | readonly ConstellationIauCode[];
  apparentMagMax: number;
  absoluteMagMax: number;
  distanceFromLy: { origin: Cartesian3; minLy?: number; maxLy: number };
  maxStars: number;
}>;

const SOLAR_POSITION: Cartesian3 = { xLy: 0, yLy: 0, zLy: 0 };

export class StarCatalog {
  private _stars: Star[] = [];
  private _starsById = new Map<string, Star>();
  private _tree: KdTree3<CatalogPoint> = new KdTree3<CatalogPoint>();
  private _tieredTrees = new Map<CatalogTier, KdTree3<CatalogPoint>>();
  private _spectralIndex = new Map<SpectralType, Star[]>();
  private _constellationIndex = new Map<ConstellationIauCode, Star[]>();
  private _tierIndex = new Map<CatalogTier, Star[]>();
  private _constellations: Constellation[] = [];
  private _nebulae: Nebula[] = [];
  private _stats: CatalogStats | null = null;

  get stats(): CatalogStats {
    if (this._stats == null) throw new Error('StarCatalog 尚未加载，请先 load()。');
    return this._stats;
  }

  get allStars(): readonly Star[] {
    return this._stars;
  }

  get size(): number {
    return this._stars.length;
  }

  async load(
    stars: readonly Star[],
    extras: { constellations?: readonly Constellation[]; nebulae?: readonly Nebula[] } = {},
  ): Promise<void> {
    if (stars.length === 0) throw new RangeError('StarCatalog.load: stars 为空数组。');
    this._stars = stars.slice();
    this._constellations = extras.constellations != null ? extras.constellations.slice() : [];
    this._nebulae = extras.nebulae != null ? extras.nebulae.slice() : [];
    this.buildIndices();
    await Promise.resolve();
  }

  findById(id: string): Star | undefined {
    return this._starsById.get(id);
  }

  findByHip(hipId: number): Star | undefined {
    return this._stars.find((s) => s.hipId === hipId);
  }

  findNearest(origin: Cartesian3 = SOLAR_POSITION, k = 1, filter?: StarFilter): StarNearestHit[] {
    const tree = this.treeForFilter(filter);
    const point = { x: origin.xLy, y: origin.yLy, z: origin.zLy };
    const kPrime = Math.min(
      Math.max(1, k),
      tree.size,
      filter?.maxStars != null ? filter.maxStars : tree.size,
    );
    const raw = tree.findNearest(point, kPrime);
    const filtered: StarNearestHit[] = [];
    for (const r of raw) {
      if (!this.matchesFilter(r.point, filter)) continue;
      filtered.push({ point: r.point, distanceSq: r.distanceSq });
    }
    return filtered;
  }

  findInRadius(origin: Cartesian3, radiusLy: number, filter?: StarFilter): StarNearestHit[] {
    if (!(radiusLy > 0)) throw new RangeError('StarCatalog.findInRadius: radiusLy 必须为正。');
    const tree = this.treeForFilter(filter);
    const point = { x: origin.xLy, y: origin.yLy, z: origin.zLy };
    const hits = tree.rangeSearch(point, radiusLy);
    const out: StarNearestHit[] = [];
    for (const r of hits) {
      if (!this.matchesFilter(r.point, filter)) continue;
      out.push({ point: r.point, distanceSq: r.distanceSq });
      if (filter?.maxStars != null && out.length >= filter.maxStars) break;
    }
    return out;
  }

  constellations(): readonly Constellation[] {
    return this._constellations;
  }

  nebulae(): readonly Nebula[] {
    return this._nebulae;
  }

  filter(filter: StarFilter): Star[] {
    const stars: Star[] = [];
    const cap = filter.maxStars ?? Number.POSITIVE_INFINITY;
    for (const s of this._stars) {
      if (!this.matchesFilter(s, filter)) continue;
      stars.push(s);
      if (stars.length >= cap) break;
    }
    return stars;
  }

  starsForLOD(
    origin: Cartesian3,
    distanceBucketLy: readonly [number, number, number, number],
  ): {
    close: Star[];
    mid: Star[];
    far: Star[];
    background: Star[];
  } {
    if (distanceBucketLy.length < 4) {
      throw new TypeError('starsForLOD: 需要 4 级分段（close/mid/far/background）。');
    }
    const [t0, t1, t2, t3] = distanceBucketLy;
    const res = {
      close: [] as Star[],
      mid: [] as Star[],
      far: [] as Star[],
      background: [] as Star[],
    };
    for (const s of this._stars) {
      const d = distanceLy3(
        { x: origin.xLy, y: origin.yLy, z: origin.zLy },
        { x: s.coords.cartesian.xLy, y: s.coords.cartesian.yLy, z: s.coords.cartesian.zLy },
      );
      if (d <= t0) res.close.push(s);
      else if (d <= t1) res.mid.push(s);
      else if (d <= t2) res.far.push(s);
      else if (d <= t3) res.background.push(s);
    }
    return res;
  }

  private buildIndices(): void {
    this._starsById.clear();
    this._spectralIndex.clear();
    this._constellationIndex.clear();
    this._tierIndex.clear();
    this._tieredTrees.clear();
    const points: CatalogPoint[] = [];
    const tierPoints = new Map<CatalogTier, CatalogPoint[]>();
    const bbox = {
      min: { x: Infinity, y: Infinity, z: Infinity },
      max: { x: -Infinity, y: -Infinity, z: -Infinity },
    };
    let maxDist = 0;
    for (const s of this._stars) {
      this._starsById.set(s.id, s);
      appendToIndex(this._spectralIndex, s.spectral.type, s);
      if (s.constellationIau != null) {
        appendToIndex(this._constellationIndex, s.constellationIau, s);
      }
      appendToIndex(this._tierIndex, s.catalogTier, s);
      const cp: CatalogPoint = Object.assign(s as object, {
        x: s.coords.cartesian.xLy,
        y: s.coords.cartesian.yLy,
        z: s.coords.cartesian.zLy,
      }) as CatalogPoint;
      points.push(cp);
      appendToIndex(tierPoints, s.catalogTier, cp);
      bbox.min.x = Math.min(bbox.min.x, cp.x);
      bbox.min.y = Math.min(bbox.min.y, cp.y);
      bbox.min.z = Math.min(bbox.min.z, cp.z);
      bbox.max.x = Math.max(bbox.max.x, cp.x);
      bbox.max.y = Math.max(bbox.max.y, cp.y);
      bbox.max.z = Math.max(bbox.max.z, cp.z);
      const distSq = cp.x * cp.x + cp.y * cp.y + cp.z * cp.z;
      if (distSq > maxDist * maxDist) maxDist = Math.sqrt(distSq);
    }
    this._tree = KdTree3.build(points);
    for (const [tier, pts] of tierPoints.entries()) {
      this._tieredTrees.set(tier, KdTree3.build(pts));
    }
    this._stats = {
      totalStars: this._stars.length,
      tierCounts: countKeys(this._tierIndex),
      spectralCounts: countKeys(this._spectralIndex),
      constellationCounts: countKeys(this._constellationIndex),
      bboxLy: {
        min: { xLy: bbox.min.x, yLy: bbox.min.y, zLy: bbox.min.z },
        max: { xLy: bbox.max.x, yLy: bbox.max.y, zLy: bbox.max.z },
      },
      maxDistanceLy: maxDist,
    };
  }

  private treeForFilter(filter?: StarFilter): KdTree3<CatalogPoint> {
    if (filter?.tier != null && typeof filter.tier === 'string') {
      return this._tieredTrees.get(filter.tier) ?? this._tree;
    }
    return this._tree;
  }

  private matchesFilter(star: Star, f?: StarFilter): boolean {
    if (f == null) return true;
    if (f.tier != null) {
      const tiers: readonly CatalogTier[] = typeof f.tier === 'string' ? [f.tier] : f.tier;
      if (!tiers.includes(star.catalogTier)) return false;
    }
    if (f.spectral != null) {
      const specs: readonly SpectralType[] =
        typeof f.spectral === 'string' ? [f.spectral] : f.spectral;
      if (!specs.includes(star.spectral.type)) return false;
    }
    if (f.constellation != null) {
      const cons: readonly ConstellationIauCode[] =
        typeof f.constellation === 'string' ? [f.constellation] : f.constellation;
      if (star.constellationIau == null || !cons.includes(star.constellationIau)) return false;
    }
    if (f.apparentMagMax != null && star.apparentMagnitude > f.apparentMagMax) return false;
    if (f.absoluteMagMax != null && star.absoluteMagnitude != null) {
      if (star.absoluteMagnitude > f.absoluteMagMax) return false;
    }
    if (f.distanceFromLy != null) {
      const d = distanceLy3(
        {
          x: f.distanceFromLy.origin.xLy,
          y: f.distanceFromLy.origin.yLy,
          z: f.distanceFromLy.origin.zLy,
        },
        {
          x: star.coords.cartesian.xLy,
          y: star.coords.cartesian.yLy,
          z: star.coords.cartesian.zLy,
        },
      );
      if (f.distanceFromLy.minLy != null && d < f.distanceFromLy.minLy) return false;
      if (d >= f.distanceFromLy.maxLy) return false;
    }
    return true;
  }
}

function appendToIndex<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const arr = map.get(key);
  if (arr == null) map.set(key, [value]);
  else arr.push(value);
}

function countKeys<K extends string>(map: Map<K, readonly unknown[]>): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const [k, v] of map) out[k] = v.length;
  return out;
}

export type { KdFindNearestResult };
