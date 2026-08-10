import { useEffect, useState } from 'react';

type OnboardingSlide = {
  title: string;
  body: string;
};

const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    title: '专注，就是星际旅行',
    body: 'Nova 把每一次专注变成一段真实的星际航程。设一个专注时长，你的飞船就驶向宇宙深处。',
  },
  {
    title: '选目的地，或设时间',
    body: '在星图里选一颗真实恒星作目的地，或直接设定专注时长。距离越远，需要的专注越久。',
  },
  {
    title: '时间膨胀效应',
    body: '速度越接近光速，时间流逝越慢。你的专注分钟 × γ（洛伦兹因子），就是宇宙中真正经过的时间。',
  },
  {
    title: '启程',
    body: '从太阳系出发，飞向半人马座 α。设定 25 分钟，按下「开始航行」，开始你的第一次远征。',
  },
];

type OnboardingDialogProps = {
  onComplete: () => void;
};

export function OnboardingDialog({ onComplete }: OnboardingDialogProps) {
  const [index, setIndex] = useState(0);
  const last = index === ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[index]!;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onComplete();
      if (event.key === 'ArrowRight')
        setIndex((i) => Math.min(i + 1, ONBOARDING_SLIDES.length - 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onComplete]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nova 入门"
      data-testid="onboarding-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-card relative z-10 w-full max-w-md animate-fade-up rounded-2xl p-8 shadow-card">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-[0.3em]">
            <span className="text-gradient-gold">NOVA</span>
            <span className="ml-3 text-sm font-normal tracking-normal text-deep-300">入门</span>
          </h2>
          <button
            type="button"
            aria-label="跳过"
            onClick={onComplete}
            className="cursor-pointer text-xs text-deep-400 transition-colors hover:text-foreground"
          >
            跳过
          </button>
        </div>

        <div className="min-h-28" key={index}>
          <h3 className="font-display text-xl font-medium tracking-wide text-foreground">
            {slide.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-deep-300">{slide.body}</p>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" data-testid="onboarding-dots">
            {ONBOARDING_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`第 ${i + 1} 页`}
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
              上一步
            </button>
            {last ? (
              <button
                type="button"
                data-testid="onboarding-start"
                onClick={onComplete}
                className="h-11 cursor-pointer rounded-xl bg-star-gold px-5 font-display text-sm font-medium tracking-wider text-[#0a1032] transition-colors hover:opacity-85"
              >
                开始航行
              </button>
            ) : (
              <button
                type="button"
                data-testid="onboarding-next"
                onClick={() => setIndex((i) => Math.min(i + 1, ONBOARDING_SLIDES.length - 1))}
                className="h-11 cursor-pointer rounded-xl bg-star-gold px-5 font-display text-sm font-medium tracking-wider text-[#0a1032] transition-colors hover:opacity-85"
              >
                下一步
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
