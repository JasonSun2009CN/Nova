import { CaptainLogPanel } from '@/components/CaptainLog/CaptainLogPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { useI18n } from '@/i18n';
import { useHistoryStore } from '@/store/useHistoryStore';
import { buildVoyageLogMarkdown } from '@/utils/export-log';

type LogViewProps = {
  onBack: () => void;
};

export function LogView({ onBack }: LogViewProps) {
  const { t, lang } = useI18n();
  const hasRecords = useHistoryStore((s) => s.records.length > 0);

  const handleExport = () => {
    const records = useHistoryStore.getState().records;
    if (records.length === 0 || typeof URL.createObjectURL !== 'function') return;
    const content = buildVoyageLogMarkdown(records, Date.now(), lang);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const filename = `nova-travel-log-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section data-testid="log-view" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-glass-border)] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('log.closeAria')}
            onClick={onBack}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-deep-300 transition-colors hover:text-foreground"
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="font-display text-base font-medium tracking-wide">{t('app.log')}</h2>
            <p className="mt-0.5 text-xs text-deep-400">{t('log.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={!hasRecords}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm text-deep-200 transition-colors duration-200 hover:text-foreground disabled:cursor-not-allowed disabled:text-deep-400"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {t('log.export')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
          <CaptainLogPanel hideRecent />
          <div className="mt-6">
            <HistoryPanel variant="embedded" />
          </div>
        </div>
      </div>
    </section>
  );
}
