import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

import type { Star } from '@/engine/contract/catalog-types';
import { buildStarPoints } from '@/engine/renderer/build-star-points';
import { BLUE_SATURATION_FACTOR } from '@/engine/renderer/doppler';

const VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vDoppler;
  uniform float uPixelRatio;
  uniform float uGamma;
  uniform float uBeta;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float fwd = clamp(-mv.z / max(length(mv.xyz), 1e-5), -1.0, 1.0);
    vDoppler = uGamma * (1.0 + uBeta * fwd);
    float dist = max(-mv.z, 0.1);
    float ps = aSize * uPixelRatio * (40.0 / dist);
    gl_PointSize = clamp(ps, 1.0, 24.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vDoppler;
  uniform float uBlueSatAt;
  vec3 blueShift(vec3 c, float f) {
    if (f <= 1.0) return c;
    float e = clamp(log(f) / log(uBlueSatAt), 0.0, 1.0);
    float r = c.r * (1.0 - e);
    float g = c.g + (c.b - c.g) * e * 0.7;
    float b = c.b + (1.0 - c.b) * e;
    return clamp(vec3(r, g, b), 0.0, 1.0);
  }
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.45, d);
    gl_FragColor = vec4(blueShift(vColor, vDoppler), alpha);
  }
`;

type StarFieldProps = {
  stars: readonly Star[];
  scale?: number;
  sizeScale?: number;
  opacity?: number;
  doppler?: { gamma: number; beta: number };
};

export function StarField({
  stars,
  scale = 1,
  sizeScale = 1,
  opacity = 1,
  doppler,
}: StarFieldProps) {
  const pixelRatio = useThree((s) => s.gl.getPixelRatio());
  const points = useMemo(
    () => buildStarPoints(stars, { scale, sizeScale }),
    [stars, scale, sizeScale],
  );
  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: pixelRatio },
      uGamma: { value: doppler?.gamma ?? 1 },
      uBeta: { value: doppler?.beta ?? 0 },
      uBlueSatAt: { value: BLUE_SATURATION_FACTOR },
    }),
    [pixelRatio, doppler],
  );

  if (stars.length === 0) return null;

  // key=星数：目录异步加载后 空→满 时强制重挂载 geometry，
  // 避免旧的空缓冲区在真实 GPU 上残留导致星空不渲染（偶发，拖动后短暂恢复）。
  return (
    <points key={stars.length}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[points.colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[points.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        opacity={opacity}
        uniforms={uniforms}
      />
    </points>
  );
}
