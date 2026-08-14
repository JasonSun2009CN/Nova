import { lazy, Suspense } from 'react';

import { CockpitGlass } from '@/components/CockpitGlass';
import { VoyageInstruments } from '@/components/VoyageInstruments';
import { ResultView } from '@/pages/ResultView';
import { SetupPanel } from '@/pages/SetupPanel';
import { useVoyageStore } from '@/store/useVoyageStore';

const StarMapBackground = lazy(() =>
  import('@/pages/StarMapBackground').then((m) => ({ default: m.StarMapBackground })),
);

export function CockpitView() {
  const status = useVoyageStore((s) => s.progress?.status ?? 'idle');
  const voyagePhase = useVoyageStore((s) => s.voyagePhase);

  const voyaging =
    status === 'running' ||
    status === 'paused' ||
    voyagePhase === 'arriving' ||
    voyagePhase === 'braking';
  const result = status === 'completed' || status === 'aborted';

  if (voyaging) {
    return (
      <section data-testid="voyage-view" className="relative h-full min-h-0 w-full overflow-hidden">
        <CockpitGlass />
        <VoyageInstruments phase={voyagePhase} />
      </section>
    );
  }

  if (result) {
    return (
      <section data-testid="voyage-view" className="relative h-full min-h-0 w-full overflow-hidden">
        <CockpitGlass />
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 py-6 sm:px-6">
          <ResultView />
        </div>
      </section>
    );
  }

  return (
    <section data-testid="voyage-view" className="relative h-full min-h-0 w-full overflow-hidden">
      <Suspense
        fallback={
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 120% at 50% 0%, var(--color-deep-900) 0%, var(--color-deep-950) 58%)',
            }}
          />
        }
      >
        <StarMapBackground />
      </Suspense>
      <SetupPanel />
    </section>
  );
}
