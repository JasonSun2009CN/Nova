import { DoubleSide } from 'three';

import type { Star } from '@/engine';

const MARKER_GOLD = '#ffd700';

export function CurrentPositionMarker() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.02, 0.4, 16]} />
        <meshBasicMaterial color={MARKER_GOLD} />
      </mesh>
      <mesh position={[0, 0.675, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.55, 12]} />
        <meshBasicMaterial color={MARKER_GOLD} />
      </mesh>
    </group>
  );
}

export function DestinationMarker({ star, scale }: { star: Star; scale: number }) {
  const c = star.coords.cartesian;
  return (
    <mesh position={[c.xLy * scale, c.yLy * scale, c.zLy * scale]}>
      <ringGeometry args={[0.9, 1.05, 48]} />
      <meshBasicMaterial
        color={MARKER_GOLD}
        transparent
        opacity={0.7}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
