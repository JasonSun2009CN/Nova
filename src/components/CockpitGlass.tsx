import { lazy, Suspense, useEffect, useMemo } from 'react';

import { DestinationStarCircle } from '@/components/DestinationStarCircle';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useVoyageStore } from '@/store/useVoyageStore';

const VoyageStarField = lazy(() =>
  import('@/engine/renderer/VoyageStarField').then((m) => ({ default: m.VoyageStarField })),
);

export function CockpitGlass() {
  const progress = useVoyageStore((s) => s.progress);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const originStarId = useVoyageStore((s) => s.originStarId);
  const voyagePhase = useVoyageStore((s) => s.voyagePhase);
  const catalogStars = useCatalogStore((s) => s.stars);

  useEffect(() => {
    void useCatalogStore.getState().load();
  }, []);

  const originStar = useMemo(
    () => catalogStars.find((s) => s.id === originStarId) ?? null,
    [catalogStars, originStarId],
  );
  const destStar = useMemo(
    () => catalogStars.find((s) => s.id === destStarId) ?? null,
    [catalogStars, destStarId],
  );
  const fieldStars = useMemo(
    () => catalogStars.filter((s) => s.id !== originStarId),
    [catalogStars, originStarId],
  );
  const legLy = useMemo(() => {
    if (originStar == null || destStar == null) return null;
    const A = originStar.coords.cartesian;
    const B = destStar.coords.cartesian;
    return Math.hypot(A.xLy - B.xLy, A.yLy - B.yLy, A.zLy - B.zLy);
  }, [originStar, destStar]);

  const gamma = progress?.gamma ?? 1;
  const vOverC = progress?.vOverC ?? 0;
  const traveledLy = progress?.traveledLy ?? 0;
  const fraction = legLy != null && legLy > 0 ? Math.min(1, traveledLy / legLy) : 0;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(120% 120% at 50% 0%, var(--color-deep-900) 0%, var(--color-deep-950) 58%)',
              }}
            />
          }
        >
          <VoyageStarField
            stars={fieldStars}
            originStar={originStar}
            destStar={destStar}
            gamma={gamma}
            vOverC={vOverC}
            traveledLy={traveledLy}
            legLy={legLy}
            phase={voyagePhase}
          />
        </Suspense>
      </div>
      <DestinationStarCircle
        star={destStar}
        fraction={fraction}
        phase={voyagePhase}
        vOverC={vOverC}
      />
    </div>
  );
}
