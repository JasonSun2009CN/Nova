import { Vector3, type Camera } from 'three';

import type { Star } from '@/engine';

const _v = new Vector3();

export type ScreenPos = Readonly<{ x: number; y: number; z: number }>;

export type PickHit = Readonly<{ star: Star; index: number; screenDistancePx: number }>;

export function projectToScreen(
  world: Readonly<{ x: number; y: number; z: number }>,
  camera: Camera,
  width: number,
  height: number,
): ScreenPos | null {
  if (!(width > 0) || !(height > 0)) return null;
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  _v.set(world.x, world.y, world.z).project(camera);
  if (_v.z < -1 || _v.z > 1) return null;
  const x = ((_v.x + 1) / 2) * width;
  const y = ((1 - _v.y) / 2) * height;
  if (x < 0 || x > width || y < 0 || y > height) return null;
  return { x, y, z: _v.z };
}

export function pickNearestStar(
  stars: readonly Star[],
  scale: number,
  camera: Camera,
  width: number,
  height: number,
  clientX: number,
  clientY: number,
  maxPx = 12,
): PickHit | null {
  if (!(width > 0) || !(height > 0)) return null;
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  let best: PickHit | null = null;
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i]!;
    const c = star.coords.cartesian;
    _v.set(c.xLy * scale, c.yLy * scale, c.zLy * scale).project(camera);
    if (_v.z < -1 || _v.z > 1) continue;
    const sx = ((_v.x + 1) / 2) * width;
    const sy = ((1 - _v.y) / 2) * height;
    if (sx < 0 || sx > width || sy < 0 || sy > height) continue;
    const dx = sx - clientX;
    const dy = sy - clientY;
    const dist = Math.hypot(dx, dy);
    if (dist <= maxPx && (best == null || dist < best.screenDistancePx)) {
      best = { star, index: i, screenDistancePx: dist };
    }
  }
  return best;
}
