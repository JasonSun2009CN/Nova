import { useEffect } from 'react';

import { AchievementPanel } from '@/components/Achievements/AchievementPanel';
import { useI18n } from '@/i18n';
import { useCatalogStore } from '@/store/useCatalogStore';

type AchievementDialogProps = {
  onClose: () => void;
};

export function AchievementDialog({ onClose }: AchievementDialogProps) {
  const { t } = useI18n();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    void useCatalogStore.getState().load();
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={t('ach.title')} className="fixed inset-0 z-30">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        data-testid="achievement-dialog"
        className="glass-card absolute inset-2 flex flex-col overflow-hidden rounded-2xl sm:inset-6 sm:mx-auto sm:max-w-3xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-glass-border)] px-5 py-3">
          <div>
            <h2 className="font-display text-base font-medium tracking-wide">{t('ach.title')}</h2>
            <p className="mt-0.5 text-xs text-deep-400">{t('ach.subtitle')}</p>
          </div>
          <button
            type="button"
            aria-label={t('ach.closeAria')}
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AchievementPanel />
        </div>
      </div>
    </div>
  );
}
