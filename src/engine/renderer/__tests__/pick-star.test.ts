import { describe, expect, it } from 'vitest';
import { MathUtils, PerspectiveCamera } from 'three';

import type { Star } from '@/engine/contract/catalog-types';
import { pickNearestStar, projectToScreen } from '@/engine/renderer/pick-star';

const WIDTH = 800;
const HEIGHT = 600;

function makeCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 500);
  camera.position.set(0, 0, 55);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return camera;
}

function makeStar(overrides: Partial<Star>): Star {
  return {
    id: 'hip-test',
    coords: {
      equatorial: { raDeg: 0, decDeg: 0, parallaxMas: null },
      galactic: { lDeg: 0, bDeg: 0, distanceLy: 1 },
      cartesian: { xLy: 0, yLy: 0, zLy: 0 },
    },
    spectral: { type: 'G' },
    apparentMagnitude: 1,
    absoluteMagnitude: 1,
    catalogTier: 'tier1-nearby-100ly',
    ...overrides,
  };
}

function atCartesian(star: Star, cartesian: { xLy: number; yLy: number; zLy: number }): Star {
  return {
    ...star,
    coords: { ...star.coords, cartesian },
  };
}

describe('projectToScreen', () => {
  it('世界原点投影到画布中心', () => {
    const camera = makeCamera();
    const pos = projectToScreen({ x: 0, y: 0, z: 0 }, camera, WIDTH, HEIGHT);
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeCloseTo(WIDTH / 2, 0);
    expect(pos!.y).toBeCloseTo(HEIGHT / 2, 0);
  });

  it('相机背后的点返回 null', () => {
    const camera = makeCamera();
    expect(projectToScreen({ x: 0, y: 0, z: 60 }, camera, WIDTH, HEIGHT)).toBeNull();
  });

  it('屏幕外的点返回 null', () => {
    const camera = makeCamera();
    expect(projectToScreen({ x: 60, y: 0, z: 0 }, camera, WIDTH, HEIGHT)).toBeNull();
  });

  it('宽高为 0 时返回 null', () => {
    const camera = makeCamera();
    expect(projectToScreen({ x: 0, y: 0, z: 0 }, camera, 0, 0)).toBeNull();
  });
});

describe('pickNearestStar', () => {
  it('点击投影中心 → 命中该星且 index 正确', () => {
    const camera = makeCamera();
    const star = atCartesian(makeStar({ id: 'a' }), { xLy: 2, yLy: 3, zLy: 4 });
    const pos = projectToScreen({ x: 2, y: 3, z: 4 }, camera, WIDTH, HEIGHT)!;
    const hit = pickNearestStar([star], 1, camera, WIDTH, HEIGHT, pos.x, pos.y);
    expect(hit?.star.id).toBe('a');
    expect(hit?.index).toBe(0);
  });

  it('点击远离所有星的位置 → null', () => {
    const camera = makeCamera();
    const star = atCartesian(makeStar({ id: 'a' }), { xLy: 2, yLy: 3, zLy: 4 });
    const hit = pickNearestStar([star], 1, camera, WIDTH, HEIGHT, 10, 10);
    expect(hit).toBeNull();
  });

  it('多个候选命中时取屏幕距离最近者', () => {
    const camera = makeCamera();
    const far = atCartesian(makeStar({ id: 'far' }), { xLy: 6, yLy: 0, zLy: 0 });
    const near = atCartesian(makeStar({ id: 'near' }), { xLy: 1, yLy: 0, zLy: 0 });
    const pos = projectToScreen({ x: 1, y: 0, z: 0 }, camera, WIDTH, HEIGHT)!;
    const hit = pickNearestStar([far, near], 1, camera, WIDTH, HEIGHT, pos.x, pos.y);
    expect(hit?.star.id).toBe('near');
  });

  it('scale 参与世界坐标缩放', () => {
    const camera = makeCamera();
    const star = atCartesian(makeStar({ id: 'a' }), { xLy: 10, yLy: 0, zLy: 0 });
    const pos = projectToScreen({ x: 5, y: 0, z: 0 }, camera, WIDTH, HEIGHT)!;
    const hit = pickNearestStar([star], 0.5, camera, WIDTH, HEIGHT, pos.x, pos.y);
    expect(hit?.star.id).toBe('a');
  });

  it('屏幕外（略超出右缘）的星不会被命中', () => {
    const camera = makeCamera();
    const halfHfovTan = Math.tan(MathUtils.degToRad(camera.fov / 2)) * (WIDTH / HEIGHT);
    const edgeWorldX = Math.abs(camera.position.z) * halfHfovTan * ((WIDTH + 5) / WIDTH);
    const star = atCartesian(makeStar({ id: 'off' }), { xLy: edgeWorldX, yLy: 0, zLy: 0 });
    const hit = pickNearestStar([star], 1, camera, WIDTH, HEIGHT, WIDTH - 1, HEIGHT / 2);
    expect(hit).toBeNull();
  });
});
