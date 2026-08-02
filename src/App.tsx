import { useEffect } from 'react';

import { HistoryPanel } from '@/components/HistoryPanel';
import { SpaceBackdrop } from '@/components/SpaceBackdrop';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ResultView } from '@/pages/ResultView';
import { SetupPanel } from '@/pages/SetupPanel';
import { VoyageView } from '@/pages/VoyageView';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoyageStore } from '@/store/useVoyageStore';

function App() {
  const progress = useVoyageStore((s) => s.progress);
  const theme = useSettingsStore((s) => s.settings.theme);

  useEffect(() => {
    void useSettingsStore.getState().load();
    void useHistoryStore.getState().load();
    void useVoyageStore.getState().resumeFromLiveVoyage();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const status = progress?.status ?? 'idle';

  return (
    <div className="relative flex min-h-dvh w-full flex-col text-foreground transition-colors duration-500">
      <SpaceBackdrop />

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-glass-border)] bg-[var(--color-glass)] px-5 py-3 backdrop-blur-xl">
        <h1 className="font-display text-xl font-bold tracking-[0.35em]">
          <span className="text-gradient-gold drop-shadow-[0_0_14px_var(--shadow-glow)]">NOVA</span>
        </h1>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        {status === 'running' || status === 'paused' ? (
          <VoyageView />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {status === 'idle' ? (
              <>
                <SetupPanel />
                <HistoryPanel />
              </>
            ) : (
              <ResultView />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
