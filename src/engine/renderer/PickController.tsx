import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

import type { Star } from '@/engine';
import { pickNearestStar } from '@/engine/renderer/pick-star';

type DownInfo = Readonly<{ x: number; y: number }>;

type PickControllerProps = {
  stars: readonly Star[];
  scale: number;
  maxPx?: number;
  onPick: (star: Star | null) => void;
};

const DRAG_IGNORE_PX = 6;

export function PickController({ stars, scale, maxPx = 12, onPick }: PickControllerProps) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  const starsRef = useRef(stars);
  starsRef.current = stars;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    const canvas = gl.domElement;
    let down: DownInfo | null = null;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      down = { x: event.clientX, y: event.clientY };
    };

    const handleClick = (event: MouseEvent) => {
      if (down == null) return;
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
      if (moved > DRAG_IGNORE_PX) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const hit = pickNearestStar(
        starsRef.current,
        scale,
        camera,
        width,
        height,
        localX,
        localY,
        maxPx,
      );
      onPickRef.current(hit?.star ?? null);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('click', handleClick);
    };
  }, [camera, gl, scale, maxPx, width, height]);

  return null;
}
