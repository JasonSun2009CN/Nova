import { useEffect, useMemo, useRef, useState } from 'react';

import type { Star } from '@/engine';
import { blueShiftColor, dopplerFactor } from '@/engine/renderer/doppler';
import { spectralColor } from '@/engine/renderer/star-colors';
import { easeOutCubic, phaseDurationMs, type VoyagePhase } from '@/engine/renderer/warp-flow';

const STAR_MIN_PX = 10;
const STAR_MAX_PX = 260;
const SETTLE_MIN = 0.92;

type Rgb = readonly [number, number, number];

function toCss(rgb: Rgb): string {
  const to255 = (v: number) => Math.round(Math.min(255, Math.max(0, v * 255)));
  return `rgb(${to255(rgb[0])}, ${to255(rgb[1])}, ${to255(rgb[2])})`;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

type DestinationStarCircleProps = {
  star: Star | null;
  fraction: number;
  phase: VoyagePhase;
  vOverC: number;
};

export function DestinationStarCircle({
  star,
  fraction,
  phase,
  vOverC,
}: DestinationStarCircleProps) {
  const [transition, setTransition] = useState(0);
  const phaseStartRef = useRef<number | null>(null);
  const lastPhaseRef = useRef<VoyagePhase>(phase);

  useEffect(() => {
    if (phase === 'arriving' || phase === 'braking') {
      if (lastPhaseRef.current !== phase) {
        phaseStartRef.current = performance.now();
      }
      let raf = 0;
      const loop = () => {
        const elapsed =
          phaseStartRef.current != null ? performance.now() - phaseStartRef.current : 0;
        const duration = phaseDurationMs(phase);
        setTransition(duration > 0 ? Math.min(1, elapsed / duration) : 1);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      lastPhaseRef.current = phase;
      return () => cancelAnimationFrame(raf);
    }
    setTransition(0);
    lastPhaseRef.current = phase;
    return undefined;
  }, [phase]);

  const spectral = useMemo<Rgb>(
    () => (star != null ? spectralColor(star.spectral.type, star.temperatureKelvin) : [1, 1, 1]),
    [star],
  );
  const blue = useMemo<Rgb>(
    () => blueShiftColor(spectral, dopplerFactor(vOverC, 1)),
    [spectral, vOverC],
  );
  const color = useMemo<Rgb>(() => {
    if (phase === 'arriving' || phase === 'braking') {
      return mix(blue, spectral, easeOutCubic(transition));
    }
    if (phase === 'launching' || phase === 'cruising') {
      return blue;
    }
    return spectral;
  }, [phase, transition, blue, spectral]);

  if (star == null) return null;

  const clampedFraction = Math.min(1, Math.max(0, fraction));
  const settle =
    phase === 'arriving' || phase === 'braking'
      ? SETTLE_MIN + (1 - SETTLE_MIN) * easeOutCubic(transition)
      : 1;
  const px = (STAR_MIN_PX + (STAR_MAX_PX - STAR_MIN_PX) * clampedFraction) * settle;

  return (
    <div
      data-testid="dest-star-circle"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <div
        className="rounded-full"
        style={{
          width: px,
          height: px,
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, ${toCss(color)} 45%, rgba(0,0,0,0) 72%)`,
          boxShadow: `0 0 ${Math.max(12, px * 0.55)}px ${toCss(color)}`,
          transition: 'width 0.4s linear, height 0.4s linear',
        }}
      />
    </div>
  );
}
