import { useEffect } from 'react';

import { HistoryPanel } from '@/components/HistoryPanel';
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
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const status = progress?.status ?? 'idle';

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-surface text-foreground transition-colors duration-500">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border px-5 py-3 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-[0.3em] text-star-gold">NOVA</h1>
        <ThemeToggle />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
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
