import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { Star } from '@/engine/contract/catalog-types';
import { FpsGovernor, QUALITY_CONFIGS, type RenderQuality } from '@/engine/renderer/fps-governor';
import { NearFieldFlow } from '@/engine/renderer/NearFieldFlow';
import { StarField } from '@/engine/renderer/StarField';
import { VoyageCameraRig, type Position3 } from '@/engine/renderer/VoyageCameraRig';
import type { VoyagePhase } from '@/engine/renderer/warp-flow';

const VOYAGE_SCALE = 0.45;
const FREE_DRIFT_DIRECTION: Position3 = [0, 0, 1];
const BG_OPACITY = 0.3;
const BG_SIZE_SCALE = 0.5;
const FOV = 60;

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

function worldOf(star: Star): Position3 {
  const c = star.coords.cartesian;
  return [c.xLy * VOYAGE_SCALE, c.yLy * VOYAGE_SCALE, c.zLy * VOYAGE_SCALE];
}

function FpsGovernorRig({
  governor,
  onQualityChange,
}: {
  governor: FpsGovernor;
  onQualityChange: (q: RenderQuality) => void;
}) {
  const lastTimeRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime() * 1000;
    if (lastTimeRef.current != null) {
      const delta = now - lastTimeRef.current;
      if (governor.update(delta)) {
        onQualityChange(governor.quality);
      }
    }
    lastTimeRef.current = now;
  });

  return null;
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
  const safeLeg = useMemo(
    () => (originStar != null && destStar != null && legLy != null && legLy > 0 ? legLy : null),
    [originStar, destStar, legLy],
  );
  const fraction = safeLeg != null ? Math.min(1, traveledLy / safeLeg) : 0;
  const advance = traveledLy * VOYAGE_SCALE;
  const governorRef = useRef<FpsGovernor | null>(null);
  if (governorRef.current == null) governorRef.current = new FpsGovernor();
  const [quality, setQuality] = useState<RenderQuality>('high');
  const qualityConfig = QUALITY_CONFIGS[quality];
  const handleQualityChange = useCallback((q: RenderQuality) => setQuality(q), []);

  return (
    <div data-testid="voyage-star-field" className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5], fov: FOV, near: 0.1, far: 500 }}>
        <StarField
          stars={stars}
          scale={VOYAGE_SCALE}
          opacity={BG_OPACITY * qualityConfig.starOpacity}
          sizeScale={BG_SIZE_SCALE * qualityConfig.starSizeScale}
          doppler={qualityConfig.doppler ? { gamma, beta: vOverC } : undefined}
        />
        <FpsGovernorRig governor={governorRef.current} onQualityChange={handleQualityChange} />
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
