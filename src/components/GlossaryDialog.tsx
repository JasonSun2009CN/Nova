import { useEffect } from 'react';

import { useI18n, type I18nKey } from '@/i18n';

const GLOSSARY_KEYS: readonly { termKey: I18nKey; explainKey: I18nKey }[] = [
  { termKey: 'glossary.gamma.term', explainKey: 'glossary.gamma.explain' },
  { termKey: 'glossary.vOverC.term', explainKey: 'glossary.vOverC.explain' },
  { termKey: 'glossary.ly.term', explainKey: 'glossary.ly.explain' },
  { termKey: 'glossary.dilation.term', explainKey: 'glossary.dilation.explain' },
  { termKey: 'glossary.subjective.term', explainKey: 'glossary.subjective.explain' },
  { termKey: 'glossary.distance.term', explainKey: 'glossary.distance.explain' },
  { termKey: 'glossary.spectral.term', explainKey: 'glossary.spectral.explain' },
  { termKey: 'glossary.freeDrift.term', explainKey: 'glossary.freeDrift.explain' },
];

type GlossaryDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function GlossaryDialog({ open, onClose }: GlossaryDialogProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-label={t('glossary.title')}
    >
      <div
        className="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass-card relative z-10 max-h-[82vh] w-full max-w-md animate-fade-up overflow-y-auto rounded-2xl p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium tracking-wide">{t('glossary.title')}</h2>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-deep-400 transition-colors hover:text-foreground"
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
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <ul className="space-y-5">
          {GLOSSARY_KEYS.map((keys) => (
            <li key={keys.termKey}>
              <div className="font-display text-sm font-medium text-star-gold">
                {t(keys.termKey)}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-deep-300">{t(keys.explainKey)}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full cursor-pointer rounded-xl bg-star-gold font-display text-sm font-medium tracking-wider text-[#0a1032] transition-colors hover:opacity-85"
        >
          {t('common.done')}
        </button>
      </div>
    </div>
  );
}
