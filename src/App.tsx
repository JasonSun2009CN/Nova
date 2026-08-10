import { lazy, Suspense, useEffect, useState } from 'react';

import { AchievementDialog } from '@/components/Achievements/AchievementDialog';
import { CaptainLogDialog } from '@/components/CaptainLog/CaptainLogDialog';
import { GlossaryDialog } from '@/components/GlossaryDialog';
import { HistoryPanel } from '@/components/HistoryPanel';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { SpaceBackdrop } from '@/components/SpaceBackdrop';
import { useAudioEngine } from '@/components/useAudioEngine';
import { useFocusNotifications } from '@/components/useFocusNotifications';
import { ResultView } from '@/pages/ResultView';
import { SetupPanel } from '@/pages/SetupPanel';
import { VoyageView } from '@/pages/VoyageView';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import { nextPhaseAfterDuration, phaseDurationMs } from '@/engine/renderer/warp-flow';

const StarMapDialog = lazy(() =>
  import('@/pages/StarMapDialog').then((m) => ({ default: m.StarMapDialog })),
);

function App() {
  const progress = useVoyageStore((s) => s.progress);
  const voyagePhase = useVoyageStore((s) => s.voyagePhase);
  const theme = useSettingsStore((s) => s.settings.theme);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const hasCompletedOnboarding = useSettingsStore((s) => s.settings.hasCompletedOnboarding);
  const [starMapOpen, setStarMapOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [captainLogOpen, setCaptainLogOpen] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useAudioEngine();
  useFocusNotifications();

  useEffect(() => {
    void useSettingsStore.getState().load();
    void useHistoryStore.getState().load();
    void useVoyageStore.getState().resumeFromLiveVoyage();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (voyagePhase == null || voyagePhase === 'cruising') return;
    const timer = window.setTimeout(
      () => useVoyageStore.getState().setVoyagePhase(nextPhaseAfterDuration(voyagePhase)),
      phaseDurationMs(voyagePhase),
    );
    return () => window.clearTimeout(timer);
  }, [voyagePhase]);

  const status = progress?.status ?? 'idle';

  useEffect(() => {
    if (settingsHydrated && status === 'idle' && !hasCompletedOnboarding) {
      setOnboardingOpen(true);
    }
  }, [settingsHydrated, status, hasCompletedOnboarding]);

  const handleOnboardingComplete = () => {
    setOnboardingOpen(false);
    void useSettingsStore.getState().updateSettings({ hasCompletedOnboarding: true });
  };
  const voyaging =
    status === 'running' ||
    status === 'paused' ||
    voyagePhase === 'arriving' ||
    voyagePhase === 'braking';

  return (
    <div className="relative flex min-h-dvh w-full flex-col text-foreground transition-colors duration-500">
      <SpaceBackdrop />

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-glass-border)] bg-[var(--color-glass)] px-6 py-4 backdrop-blur-sm">
        <h1 className="font-display text-lg font-semibold tracking-[0.3em]">
          <span className="text-gradient-gold">NOVA</span>
        </h1>
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <>
              <button
                type="button"
                onClick={() => setAchievementOpen(true)}
                className="h-11 cursor-pointer rounded-xl px-3 font-display text-sm transition-colors duration-200 hover:text-foreground"
              >
                成就
              </button>
              <button
                type="button"
                onClick={() => setCaptainLogOpen(true)}
                className="h-11 cursor-pointer rounded-xl px-3 font-display text-sm transition-colors duration-200 hover:text-foreground"
              >
                日志
              </button>
              <button
                type="button"
                onClick={() => setStarMapOpen(true)}
                className="h-11 cursor-pointer rounded-xl px-3 font-display text-sm transition-colors duration-200 hover:text-foreground"
              >
                星图
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="星际航行术语"
            onClick={() => setGlossaryOpen(true)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-deep-400 transition-colors duration-200 hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8v0.01" />
            </svg>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        {voyaging ? (
          <VoyageView phase={voyagePhase} />
        ) : status === 'idle' ? (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto grid w-full max-w-6xl lg:grid-cols-2 lg:gap-10 lg:px-8">
              <SetupPanel />
              <HistoryPanel />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ResultView />
          </div>
        )}
      </main>

      {starMapOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 text-sm text-deep-400">
              加载星图…
            </div>
          }
        >
          <StarMapDialog onClose={() => setStarMapOpen(false)} />
        </Suspense>
      )}

      {captainLogOpen && <CaptainLogDialog onClose={() => setCaptainLogOpen(false)} />}

      {achievementOpen && <AchievementDialog onClose={() => setAchievementOpen(false)} />}

      {onboardingOpen && <OnboardingDialog onComplete={handleOnboardingComplete} />}

      <GlossaryDialog open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </div>
  );
}

export default App;
