import { useEffect, useState } from 'react';

import { useI18n, type I18nKey } from '@/i18n';

const SLIDE_TITLES: readonly { titleKey: I18nKey; bodyKey: I18nKey }[] = [
  { titleKey: 'onboarding.s1Title', bodyKey: 'onboarding.s1Body' },
  { titleKey: 'onboarding.s2Title', bodyKey: 'onboarding.s2Body' },
  { titleKey: 'onboarding.s3Title', bodyKey: 'onboarding.s3Body' },
  { titleKey: 'onboarding.s4Title', bodyKey: 'onboarding.s4Body' },
];

type OnboardingDialogProps = {
  onComplete: () => void;
};

export function OnboardingDialog({ onComplete }: OnboardingDialogProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const last = index === SLIDE_TITLES.length - 1;
  const slide = SLIDE_TITLES[index]!;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onComplete();
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, SLIDE_TITLES.length - 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onComplete]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.aria')}
      data-testid="onboarding-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-card relative z-10 w-full max-w-md animate-fade-up rounded-2xl p-8 shadow-card">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-[0.3em]">
            <span className="text-gradient-gold">NOVA</span>
            <span className="ml-3 text-sm font-normal tracking-normal text-deep-300">
              {t('onboarding.badge')}
            </span>
          </h2>
          <button
            type="button"
            aria-label={t('onboarding.skip')}
            onClick={onComplete}
            className="cursor-pointer text-xs text-deep-400 transition-colors hover:text-foreground"
          >
            {t('onboarding.skip')}
          </button>
        </div>

        <div className="min-h-28" key={index}>
          <h3 className="font-display text-xl font-medium tracking-wide text-foreground">
            {t(slide.titleKey)}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-deep-300">{t(slide.bodyKey)}</p>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" data-testid="onboarding-dots">
            {SLIDE_TITLES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t('onboarding.pageAria', { page: i + 1 })}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-200 ${
                  i === index ? 'w-5 bg-star-gold' : 'w-1.5 bg-deep-400'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              disabled={index === 0}
              className="h-11 cursor-pointer rounded-xl px-4 font-display text-sm text-deep-300 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('onboarding.back')}
            </button>
            {last ? (
              <button
                type="button"
                data-testid="onboarding-start"
                onClick={onComplete}
                className="h-11 cursor-pointer rounded-xl bg-star-gold px-5 font-display text-sm font-medium tracking-wider text-[#0a1032] transition-colors hover:opacity-85"
              >
                {t('onboarding.start')}
              </button>
            ) : (
              <button
                type="button"
                data-testid="onboarding-next"
                onClick={() => setIndex((i) => Math.min(i + 1, SLIDE_TITLES.length - 1))}
                className="h-11 cursor-pointer rounded-xl bg-star-gold px-5 font-display text-sm font-medium tracking-wider text-[#0a1032] transition-colors hover:opacity-85"
              >
                {t('onboarding.next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
