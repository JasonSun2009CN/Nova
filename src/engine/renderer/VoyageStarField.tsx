import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Mesh } from 'three';

import type { Star } from '@/engine/contract/catalog-types';
import { StarField } from '@/engine/renderer/StarField';
import { spectralColor } from '@/engine/renderer/star-colors';
import { VoyageCameraRig, type Position3 } from '@/engine/renderer/VoyageCameraRig';

const VOYAGE_SCALE = 0.45;
const FREE_DRIFT_DIRECTION: Position3 = [0, 0, 1];
const BG_OPACITY = 0.3;
const BG_SIZE_SCALE = 0.5;
const STAR_START_PX = 8;
const STAR_END_PX = 300;
const FOV = 60;

const GLOW_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOW_FRAGMENT = `
  varying vec2 vUv;
  uniform vec3 uColor;
  void main() {
    vec2 c = vUv - vec2(0.5);
    float d = length(c) * 2.0;
    float core = exp(-d * d * 30.0);
    float glow = exp(-d * d * 7.0);
    vec3 col = mix(vec3(1.0), uColor, 0.7) * core + uColor * glow * 0.6;
    float alpha = max(core, glow * 0.55);
    gl_FragColor = vec4(col, alpha);
  }
`;

type VoyageStarFieldProps = {
  stars: readonly Star[];
  originStar: Star | null;
  destStar: Star | null;
  traveledLy: number;
  legLy: number | null;
};

function worldOf(star: Star): Position3 {
  const c = star.coords.cartesian;
  return [c.xLy * VOYAGE_SCALE, c.yLy * VOYAGE_SCALE, c.zLy * VOYAGE_SCALE];
}

function DestinationStar({
  position,
  color,
  fraction,
}: {
  position: Position3;
  color: [number, number, number];
  fraction: number;
}) {
  const camera = useThree((s) => s.camera);
  const height = useThree((s) => s.size.height);
  const ref = useRef<Mesh | null>(null);
  const uniforms = useMemo(() => ({ uColor: { value: color } }), [color]);

  useFrame(() => {
    const mesh = ref.current;
    if (mesh == null) return;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.lookAt(camera.position);
    const pixels =
      STAR_START_PX + (STAR_END_PX - STAR_START_PX) * Math.min(1, Math.max(0, fraction));
    const dist = Math.max(mesh.position.distanceTo(camera.position), 0.05);
    const halfFov = (FOV / 2) * (Math.PI / 180);
    const worldScale = (pixels / height) * 2 * dist * Math.tan(halfFov);
    mesh.scale.setScalar(worldScale);
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={GLOW_VERTEX}
        fragmentShader={GLOW_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function VoyageStarField({
  stars,
  originStar,
  destStar,
  traveledLy,
  legLy,
}: VoyageStarFieldProps) {
  const originWorld = useMemo(
    () => (originStar != null ? worldOf(originStar) : null),
    [originStar],
  );
  const destWorld = useMemo(() => (destStar != null ? worldOf(destStar) : null), [destStar]);
  const destColor = useMemo(() => {
    if (destStar == null) return null;
    const rgb = spectralColor(destStar.spectral.type, destStar.temperatureKelvin);
    return [rgb[0], rgb[1], rgb[2]] as [number, number, number];
  }, [destStar]);
  const safeLeg = useMemo(
    () => (originStar != null && destStar != null && legLy != null && legLy > 0 ? legLy : null),
    [originStar, destStar, legLy],
  );
  const fraction = safeLeg != null ? Math.min(1, traveledLy / safeLeg) : 0;
  const advance = traveledLy * VOYAGE_SCALE;

  return (
    <div data-testid="voyage-star-field" className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5], fov: FOV, near: 0.1, far: 500 }}>
        <StarField
          stars={stars}
          scale={VOYAGE_SCALE}
          opacity={BG_OPACITY}
          sizeScale={BG_SIZE_SCALE}
        />
        {destStar != null && destWorld != null && destColor != null && (
          <DestinationStar position={destWorld} color={destColor} fraction={fraction} />
        )}
        <VoyageCameraRig
          origin={originWorld}
          target={destWorld}
          direction={FREE_DRIFT_DIRECTION}
          fraction={fraction}
          advance={advance}
        />
      </Canvas>
    </div>
  );
}
