import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

import type { Star } from '@/engine/contract/catalog-types';
import { buildStarPoints } from '@/engine/renderer/build-star-points';

const VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  uniform float uPixelRatio;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-mv.z, 0.1);
    float ps = aSize * uPixelRatio * (80.0 / dist);
    gl_PointSize = clamp(ps, 1.0, 60.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

type StarFieldProps = {
  stars: readonly Star[];
  scale?: number;
  sizeScale?: number;
};

export function StarField({ stars, scale = 1, sizeScale = 1 }: StarFieldProps) {
  const pixelRatio = useThree((s) => s.gl.getPixelRatio());
  const points = useMemo(
    () => buildStarPoints(stars, { scale, sizeScale }),
    [stars, scale, sizeScale],
  );
  const uniforms = useMemo(() => ({ uPixelRatio: { value: pixelRatio } }), [pixelRatio]);

  return (
    <points>
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
        uniforms={uniforms}
      />
    </points>
  );
}
