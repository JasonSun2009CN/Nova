import { useEffect } from 'react';

import { useI18n } from '@/i18n';
import { StarMapView } from '@/pages/StarMapView';

type StarMapDialogProps = {
  onClose: () => void;
};

export function StarMapDialog({ onClose }: StarMapDialogProps) {
  const { t } = useI18n();

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('app.starmap')}
      className="fixed inset-0 z-30"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        data-testid="starmap-dialog"
        className="glass-card absolute inset-2 flex flex-col overflow-hidden rounded-2xl sm:inset-6"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-glass-border)] px-5 py-3">
          <div>
            <h2 className="font-display text-base font-medium tracking-wide">{t('app.starmap')}</h2>
            <p className="mt-0.5 text-xs text-deep-400">{t('starmap.hintSetDest')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t('starmap.closeAria')}
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
        <div className="min-h-0 flex-1">
          <StarMapView onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
