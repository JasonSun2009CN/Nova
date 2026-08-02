export type KdPoint3 = Readonly<{ x: number; y: number; z: number }>;

type Node<T extends KdPoint3> = Readonly<{
  point: T;
  left: Node<T> | null;
  right: Node<T> | null;
}>;

const K = 3;
const AXIS: readonly ['x', 'y', 'z'] = ['x', 'y', 'z'];

function axisAt(depth: number): 'x' | 'y' | 'z' {
  return AXIS[depth % K]!;
}

export type FindNearestResult<T extends KdPoint3> = Readonly<{
  point: T;
  distanceSq: number;
}>;

export type StarNearestHit = Readonly<{ point: unknown; distanceSq: number }>;

export class KdTree3<T extends KdPoint3> {
  private root: Node<T> | null = null;
  private _size = 0;

  get size(): number {
    return this._size;
  }

  static build<T extends KdPoint3>(points: readonly T[]): KdTree3<T> {
    const tree = new KdTree3<T>();
    if (points.length === 0) return tree;
    const working = points.slice();
    tree.root = KdTree3.buildRecursive(working, 0);
    tree._size = points.length;
    return tree;
  }

  findNearest(query: KdPoint3, k = 1): FindNearestResult<T>[] {
    if (this.root == null) return [];
    const best: { point: T; distanceSq: number }[] = [];
    const maxK = Math.max(1, k);
    KdTree3.nearestRecursive(this.root, query, 0, best, maxK);
    return best.slice(0, maxK) as FindNearestResult<T>[];
  }

  rangeSearch(center: KdPoint3, radiusLy: number): FindNearestResult<T>[] {
    const hits: FindNearestResult<T>[] = [];
    const r2 = radiusLy * radiusLy;
    if (this.root == null) return hits;
    const stack: { node: Node<T>; depth: number }[] = [{ node: this.root, depth: 0 }];
    while (stack.length > 0) {
      const frame = stack.pop();
      if (frame == null) continue;
      const { node, depth } = frame;
      const dx = node.point.x - center.x;
      const dy = node.point.y - center.y;
      const dz = node.point.z - center.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq <= r2) {
        hits.push({ point: node.point, distanceSq: distSq });
      }
      const axis = axisAt(depth);
      const axisDelta = node.point[axis] - center[axis];
      const planeCross = axisDelta * axisDelta <= r2;
      if (axisDelta > 0) {
        if (node.left != null) stack.push({ node: node.left, depth: depth + 1 });
        if (planeCross && node.right != null) stack.push({ node: node.right, depth: depth + 1 });
      } else {
        if (node.right != null) stack.push({ node: node.right, depth: depth + 1 });
        if (planeCross && node.left != null) stack.push({ node: node.left, depth: depth + 1 });
      }
    }
    hits.sort((a, b) => a.distanceSq - b.distanceSq);
    return hits;
  }

  inPlaceRebuild(newPoints: readonly T[]): void {
    if (newPoints.length === 0) {
      this.root = null;
      this._size = 0;
      return;
    }
    const working = newPoints.slice();
    this.root = KdTree3.buildRecursive(working, 0);
    this._size = newPoints.length;
  }

  private static buildRecursive<T extends KdPoint3>(points: T[], depth: number): Node<T> | null {
    const n = points.length;
    if (n === 0) return null;
    const axis = axisAt(depth);
    const median = n >> 1;
    KdTree3.partialQuickSelect(points, 0, n - 1, median, axis);
    const pivot = points[median]!;
    return {
      point: pivot,
      left: KdTree3.buildRecursive(points.slice(0, median), depth + 1),
      right: KdTree3.buildRecursive(points.slice(median + 1), depth + 1),
    };
  }

  private static nearestRecursive<T extends KdPoint3>(
    node: Node<T>,
    query: KdPoint3,
    depth: number,
    best: { point: T; distanceSq: number }[],
    k: number,
  ): void {
    const axis = axisAt(depth);
    const dx = node.point.x - query.x;
    const dy = node.point.y - query.y;
    const dz = node.point.z - query.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    KdTree3.insertBest(best, { point: node.point, distanceSq: distSq }, k);
    const axisDelta = node.point[axis] - query[axis];
    const primary = axisDelta > 0 ? node.left : node.right;
    const secondary = axisDelta > 0 ? node.right : node.left;
    if (primary != null) KdTree3.nearestRecursive(primary, query, depth + 1, best, k);
    const worstNow = best.length < k ? Infinity : best[best.length - 1]!.distanceSq;
    if (axisDelta * axisDelta < worstNow) {
      if (secondary != null) KdTree3.nearestRecursive(secondary, query, depth + 1, best, k);
    }
  }

  private static insertBest<T extends KdPoint3>(
    best: { point: T; distanceSq: number }[],
    candidate: { point: T; distanceSq: number },
    k: number,
  ): void {
    if (best.length < k) {
      best.push(candidate);
      best.sort((a, b) => a.distanceSq - b.distanceSq);
    } else if (candidate.distanceSq < best[best.length - 1]!.distanceSq) {
      best[best.length - 1] = candidate;
      best.sort((a, b) => a.distanceSq - b.distanceSq);
    }
  }

  private static partialQuickSelect<T extends KdPoint3>(
    arr: T[],
    lo: number,
    hi: number,
    k: number,
    axis: 'x' | 'y' | 'z',
  ): void {
    while (lo < hi) {
      const pivotVal = arr[k]![axis];
      KdTree3.swap(arr, k, hi);
      let store = lo;
      for (let i = lo; i < hi; i++) {
        const iv = arr[i]![axis];
        if (iv < pivotVal) {
          KdTree3.swap(arr, i, store);
          store += 1;
        }
      }
      KdTree3.swap(arr, hi, store);
      if (store === k) return;
      if (store < k) lo = store + 1;
      else hi = store - 1;
    }
  }

  private static swap<T>(arr: T[], i: number, j: number): void {
    if (i === j) return;
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
}

export function distanceSq3(a: KdPoint3, b: KdPoint3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function distanceLy3(a: KdPoint3, b: KdPoint3): number {
  return Math.sqrt(distanceSq3(a, b));
}
