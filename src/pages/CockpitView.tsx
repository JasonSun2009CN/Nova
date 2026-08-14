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

  if (voyaging || result) {
    const rows = result ? 'grid-rows-[7fr_4fr]' : 'grid-rows-[8fr_3fr]';
    return (
      <section
        data-testid="voyage-view"
        className={`grid h-full min-h-0 w-full ${rows} overflow-hidden`}
      >
        <div className="relative min-h-0 overflow-hidden">
          <CockpitGlass />
        </div>
        <div className="relative min-h-0 overflow-y-auto px-4 pb-6 pt-4 sm:px-6">
          {voyaging ? <VoyageInstruments phase={voyagePhase} /> : <ResultView />}
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
