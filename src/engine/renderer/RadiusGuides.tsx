import { useMemo } from 'react';

const GUIDE_COLOR = '#7d8494';
const DEFAULT_RADII_LY = [10, 25, 50];
const CIRCLE_SEGMENTS = 64;

type RadiusGuidesProps = {
  scale: number;
  radiiLy?: readonly number[];
};

type CirclePlane = 'xy' | 'xz' | 'yz';

function circlePositions(radius: number, plane: CirclePlane): Float32Array {
  const points = new Float32Array(CIRCLE_SEGMENTS * 3);
  for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
    const a = (i / CIRCLE_SEGMENTS) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (plane === 'xy') points.set([x, y, 0], i * 3);
    else if (plane === 'xz') points.set([x, 0, y], i * 3);
    else points.set([0, x, y], i * 3);
  }
  return points;
}

function RadiusGuideSphere({ radius }: { radius: number }) {
  const xy = useMemo(() => circlePositions(radius, 'xy'), [radius]);
  const xz = useMemo(() => circlePositions(radius, 'xz'), [radius]);
  const yz = useMemo(() => circlePositions(radius, 'yz'), [radius]);

  return (
    <group>
      {[xy, xz, yz].map((positions, index) => (
        <lineLoop key={index}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={GUIDE_COLOR} transparent opacity={0.4} depthWrite={false} />
        </lineLoop>
      ))}
    </group>
  );
}

/**
 * 以太阳（原点）为中心的同心线框球，标记「距太阳 X 光年」的球形边界。
 * 每层球由三条相互正交的大圆构成，仅在上帝全览视角下显示。
 */
export function RadiusGuides({ scale, radiiLy = DEFAULT_RADII_LY }: RadiusGuidesProps) {
  return (
    <group>
      {radiiLy.map((ly) => (
        <RadiusGuideSphere key={ly} radius={ly * scale} />
      ))}
    </group>
  );
}
