import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { LineBasicMaterial, LineSegments } from 'three';
import { AdditiveBlending } from 'three';

import { flowIntensity, type VoyagePhase } from '@/engine/renderer/warp-flow';

const FLOW_STAR_COUNT = 240;
const FLOW_DEPTH = 28;
const FLOW_RADIUS = 8;
const FLOW_NEAR = 3;
const FLOW_BASE_SPEED = 20;
const STREAK_MAX = 3.5;
const BASE_OPACITY = 0.85;

type FlowStar = {
  x: number;
  y: number;
  z: number;
  jitter: number;
};

type NearFieldFlowProps = {
  phase: VoyagePhase;
};

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function NearFieldFlow({ phase }: NearFieldFlowProps) {
  const camera = useThree((s) => s.camera);
  const ref = useRef<LineSegments | null>(null);
  const starsRef = useRef<FlowStar[]>([]);
  const elapsedRef = useRef(0);
  const mountedRef = useRef(false);

  const stars = useMemo<FlowStar[]>(() => {
    if (starsRef.current.length > 0) return starsRef.current;
    const list: FlowStar[] = [];
    for (let i = 0; i < FLOW_STAR_COUNT; i++) {
      const radius = Math.sqrt(Math.random()) * FLOW_RADIUS;
      const angle = Math.random() * Math.PI * 2;
      list.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z: -(FLOW_DEPTH + Math.random() * FLOW_DEPTH),
        jitter: 0.7 + Math.random() * 0.6,
      });
    }
    starsRef.current = list;
    return list;
  }, []);

  useEffect(() => {
    const obj = ref.current;
    if (obj == null) return;
    camera.add(obj);
    const material = obj.material as LineBasicMaterial;
    material.blending = AdditiveBlending;
    mountedRef.current = true;
    return () => {
      camera.remove(obj);
      mountedRef.current = false;
    };
  }, [camera]);

  useFrame((_, delta) => {
    const obj = ref.current;
    if (obj == null || !mountedRef.current) return;
    elapsedRef.current += delta * 1000;
    const intensity = flowIntensity(phase, elapsedRef.current);
    const speed = FLOW_BASE_SPEED * intensity;
    const positions = obj.geometry.attributes.position;
    if (positions == null) return;
    const array = positions.array as Float32Array;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      if (s == null) continue;
      s.z += speed * s.jitter * delta;
      if (s.z > FLOW_NEAR) {
        s.z = -(FLOW_DEPTH + Math.random() * FLOW_DEPTH);
      }
      const streak = STREAK_MAX * (0.25 + intensity);
      const idx = i * 6;
      array[idx] = s.x;
      array[idx + 1] = s.y;
      array[idx + 2] = s.z;
      array[idx + 3] = s.x;
      array[idx + 4] = s.y;
      array[idx + 5] = s.z + streak;
    }
    positions.needsUpdate = true;
    const material = obj.material as LineBasicMaterial;
    material.opacity = clamp01(BASE_OPACITY * intensity);
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(FLOW_STAR_COUNT * 6), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#cfe4ff" transparent opacity={0} depthWrite={false} />
    </lineSegments>
  );
}
