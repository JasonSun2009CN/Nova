import { useEffect, useRef } from 'react';

type VoyageStarFlowProps = {
  speed: number;
  active: boolean;
};

type FlowStar = {
  x: number;
  y: number;
  z: number;
  c: number;
};

const STAR_COUNT = 140;
const NEAR_Z = 0.1;
const FAR_Z = 1;
const BASE_STEP = 0.008;
const SPEED_FACTOR = 0.07;

function makeStars(): FlowStar[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: NEAR_Z + Math.random() * (FAR_Z - NEAR_Z),
    c: Math.random(),
  }));
}

export function VoyageStarFlow({ speed, active }: VoyageStarFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (ctx == null) return;

    let stars = makeStars();
    const colors = { gold: '#ffd700', blue: '#8ab4ff', white: '#f8fafc' };

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors.gold = cs.getPropertyValue('--color-star-gold').trim() || colors.gold;
      colors.blue = cs.getPropertyValue('--color-star-blue').trim() || colors.blue;
      colors.white = cs.getPropertyValue('--color-star-white').trim() || colors.white;
    };
    readColors();

    let sizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      sizeObserver = new ResizeObserver(() => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (w === 0 || h === 0) return;
        const dpr = window.devicePixelRatio ?? 1;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        stars = makeStars();
        draw();
      });
      sizeObserver.observe(canvas);
    }

    let themeObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(readColors);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const focal = Math.min(w, h) * 1.5;
      const baseSize = Math.max(1, Math.min(w, h) / 260);
      const streakLen = 0.12 + speed * 0.5;
      const palette = [colors.gold, colors.blue, colors.white];
      for (const s of stars) {
        const sx = cx + (s.x * focal) / s.z;
        const sy = cy + (s.y * focal) / s.z;
        if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;
        const near = 1.6 - s.z;
        ctx.strokeStyle = palette[s.c % 3]!;
        ctx.lineWidth = baseSize * (0.6 + near * 1.8);
        ctx.globalAlpha = 0.25 + near * 0.75;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (sx - cx) * streakLen, sy + (sy - cy) * streakLen);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let lastTs = 0;
    const frame = (ts: number) => {
      const dt = lastTs === 0 ? 16.7 : ts - lastTs;
      lastTs = ts;
      const step = (BASE_STEP + speed * SPEED_FACTOR) * (dt / 16.7);
      if (active) {
        for (const s of stars) {
          s.z -= step;
          if (s.z < NEAR_Z) {
            s.z = FAR_Z;
            s.x = Math.random() * 2 - 1;
            s.y = Math.random() * 2 - 1;
            s.c = Math.random();
          }
        }
      }
      draw();
      if (typeof requestAnimationFrame === 'function') {
        raf = requestAnimationFrame(frame);
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      raf = requestAnimationFrame(frame);
    } else {
      draw();
    }

    return () => {
      if (raf !== 0 && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(raf);
      }
      sizeObserver?.disconnect();
      themeObserver?.disconnect();
    };
  }, [speed, active]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
