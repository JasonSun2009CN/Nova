import { useMemo } from 'react';
import * as THREE from 'three';

import type { Nebula } from '@/engine/contract/catalog-types';

const PROJECT_DIST = 480;
const NEBULA_OPACITY = 0.4;
const MIN_RADIUS = 0.4;

const TYPE_COLORS: Readonly<Record<Nebula['type'], string>> = {
  'emission': '#7aa2c4',
  'reflection': '#6b9bb8',
  'dark': '#4a4f57',
  'planetary': '#8fbf8f',
  'snr': '#c08a8a',
  'hii': '#7aa2c4',
  'galaxy': '#9aa3b2',
  'cluster-open': '#c9a86b',
  'cluster-globular': '#a98a5a',
};

let cachedTexture: THREE.CanvasTexture | null = null;

function makeNebulaTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx == null) throw new Error('无法创建 canvas 2d 上下文');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function getNebulaTexture(): THREE.CanvasTexture {
  if (cachedTexture == null) cachedTexture = makeNebulaTexture();
  return cachedTexture;
}

function worldDiameter(n: Nebula): number {
  const major = n.sizeArcMin?.major ?? 30;
  const radiusRad = (major / 2 / 60) * (Math.PI / 180);
  return Math.max(MIN_RADIUS, radiusRad * PROJECT_DIST) * 2;
}

export function NebulaField({ nebulae }: { nebulae: readonly Nebula[] }) {
  const sprites = useMemo(() => {
    if (nebulae.length === 0) return null;
    const texture = getNebulaTexture();
    return nebulae.map((n) => {
      const c = n.coords.cartesian;
      const len = Math.hypot(c.xLy, c.yLy, c.zLy) || 1;
      const dir = PROJECT_DIST / len;
      const size = worldDiameter(n);
      return {
        key: n.id,
        position: [c.xLy * dir, c.yLy * dir, c.zLy * dir] as [number, number, number],
        size,
        color: TYPE_COLORS[n.type] ?? '#9aa3b2',
        texture,
      };
    });
  }, [nebulae]);

  if (sprites == null) return null;

  return (
    <group>
      {sprites.map((s) => (
        <sprite key={s.key} position={s.position} scale={[s.size, s.size, 1]}>
          <spriteMaterial
            map={s.texture}
            color={s.color}
            transparent
            opacity={NEBULA_OPACITY}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}
