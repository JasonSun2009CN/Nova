import { useEffect } from 'react';

import { CaptainLogPanel } from '@/components/CaptainLog/CaptainLogPanel';
import { useHistoryStore } from '@/store/useHistoryStore';
import { buildVoyageLogMarkdown } from '@/utils/export-log';

type CaptainLogDialogProps = {
  onClose: () => void;
};

export function CaptainLogDialog({ onClose }: CaptainLogDialogProps) {
  const hasRecords = useHistoryStore((s) => s.records.length > 0);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleExport = () => {
    const records = useHistoryStore.getState().records;
    if (records.length === 0 || typeof URL.createObjectURL !== 'function') return;
    const content = buildVoyageLogMarkdown(records);
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
    <div role="dialog" aria-modal="true" aria-label="船长日志" className="fixed inset-0 z-30">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        data-testid="captain-log-dialog"
        className="glass-card absolute inset-2 flex flex-col overflow-hidden rounded-2xl sm:inset-6 sm:mx-auto sm:max-w-3xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-glass-border)] px-5 py-3">
          <div>
            <h2 className="font-display text-base font-medium tracking-wide">船长日志</h2>
            <p className="mt-0.5 text-xs text-deep-400">你的星际专注总览</p>
          </div>
          <div className="flex items-center gap-1">
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
              导出
            </button>
            <button
              type="button"
              aria-label="关闭船长日志"
              onClick={onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-deep-400 transition-colors hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CaptainLogPanel />
        </div>
      </div>
    </div>
  );
}
