import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Mesh } from 'three';

import type { Star } from '@/engine/contract/catalog-types';
import { blueShiftColor, dopplerFactor } from '@/engine/renderer/doppler';
import { NearFieldFlow } from '@/engine/renderer/NearFieldFlow';
import { StarField } from '@/engine/renderer/StarField';
import { spectralColor } from '@/engine/renderer/star-colors';
import { VoyageCameraRig, type Position3 } from '@/engine/renderer/VoyageCameraRig';
import { easeOutCubic, transitionProgress, type VoyagePhase } from '@/engine/renderer/warp-flow';

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
  gamma: number;
  vOverC: number;
  traveledLy: number;
  legLy: number | null;
  phase: VoyagePhase;
};

const ARRIVE_SETTLE_MIN = 0.92;

function worldOf(star: Star): Position3 {
  const c = star.coords.cartesian;
  return [c.xLy * VOYAGE_SCALE, c.yLy * VOYAGE_SCALE, c.zLy * VOYAGE_SCALE];
}

function DestinationStar({
  position,
  color,
  fraction,
  phase,
}: {
  position: Position3;
  color: [number, number, number];
  fraction: number;
  phase: VoyagePhase;
}) {
  const camera = useThree((s) => s.camera);
  const height = useThree((s) => s.size.height);
  const ref = useRef<Mesh | null>(null);
  const arriveClockRef = useRef(0);
  const prevPhaseRef = useRef<VoyagePhase>(phase);
  const uniforms = useMemo(() => ({ uColor: { value: color } }), [color]);

  useFrame((_, delta) => {
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase;
      arriveClockRef.current = 0;
    }
    arriveClockRef.current += delta * 1000;
    const arrive =
      phase === 'arriving' ? transitionProgress('arriving', arriveClockRef.current) : 0;

    const mesh = ref.current;
    if (mesh == null) return;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.lookAt(camera.position);
    const settle = ARRIVE_SETTLE_MIN + (1 - ARRIVE_SETTLE_MIN) * easeOutCubic(arrive);
    const pixels =
      (STAR_START_PX + (STAR_END_PX - STAR_START_PX) * Math.min(1, Math.max(0, fraction))) * settle;
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
  gamma,
  vOverC,
  traveledLy,
  legLy,
  phase,
}: VoyageStarFieldProps) {
  const originWorld = useMemo(
    () => (originStar != null ? worldOf(originStar) : null),
    [originStar],
  );
  const destWorld = useMemo(() => (destStar != null ? worldOf(destStar) : null), [destStar]);
  const destDoppler = useMemo(
    () => (destStar != null ? dopplerFactor(vOverC, 1) : 1),
    [destStar, vOverC],
  );
  const destColor = useMemo(() => {
    if (destStar == null) return null;
    const rgb = spectralColor(destStar.spectral.type, destStar.temperatureKelvin);
    const shifted = blueShiftColor(rgb, destDoppler);
    return [shifted[0], shifted[1], shifted[2]] as [number, number, number];
  }, [destStar, destDoppler]);
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
          doppler={{ gamma, beta: vOverC }}
        />
        {destStar != null && destWorld != null && destColor != null && (
          <DestinationStar
            position={destWorld}
            color={destColor}
            fraction={fraction}
            phase={phase}
          />
        )}
        {(phase === 'launching' || phase === 'braking') && <NearFieldFlow phase={phase} />}
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
