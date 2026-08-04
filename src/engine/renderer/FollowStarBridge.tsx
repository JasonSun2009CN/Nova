import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';

import type { Star } from '@/engine';
import { projectToScreen } from '@/engine/renderer/pick-star';

type FollowStarBridgeProps = {
  star: Star | null;
  scale: number;
  targetRef: RefObject<HTMLDivElement | null>;
};

const GAP_PX = 14;
const MARGIN_PX = 8;

export function FollowStarBridge({ star, scale, targetRef }: FollowStarBridgeProps) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dimsRef = useRef<{ id: string; width: number; height: number } | null>(null);

  useFrame(() => {
    const el = targetRef.current;
    if (el == null) return;
    if (star == null) {
      el.style.display = 'none';
      dimsRef.current = null;
      return;
    }
    const c = star.coords.cartesian;
    const pos = projectToScreen(
      { x: c.xLy * scale, y: c.yLy * scale, z: c.zLy * scale },
      camera,
      width,
      height,
    );
    if (pos == null) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';

    const dims = dimsRef.current;
    if (dims == null || dims.id !== star.id || dims.width === 0) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        dimsRef.current = { id: star.id, width: rect.width, height: rect.height };
      }
    }
    const cardWidth = dims?.id === star.id && dims.width > 0 ? dims.width : 256;
    const cardHeight = dims?.id === star.id && dims.height > 0 ? dims.height : 320;

    const left = pos.x - cardWidth / 2;
    const top = pos.y - cardHeight - GAP_PX;
    const maxX = Math.max(MARGIN_PX, width - cardWidth - MARGIN_PX);
    const maxY = Math.max(MARGIN_PX, height - cardHeight - MARGIN_PX);
    const x = Math.min(Math.max(left, MARGIN_PX), maxX);
    const y = Math.min(Math.max(top, MARGIN_PX), maxY);
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  return null;
}
