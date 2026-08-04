import { useEffect } from 'react';

type GlossaryItem = {
  term: string;
  explain: string;
};

const GLOSSARY: GlossaryItem[] = [
  {
    term: 'γ · 洛伦兹因子',
    explain:
      '衡量时间膨胀的倍数。γ = 1/√(1−v²/c²)，速度越接近光速 γ 越大。以 0.99c 航行时 γ ≈ 7.09，即飞船内专注 1 小时，宇宙已过去约 7 小时。',
  },
  {
    term: 'v/c · 相对速度',
    explain: '飞船速度与光速的比值。0.99c 表示以 99% 光速航行，越接近 1 越接近光速。',
  },
  {
    term: '光年 · ly',
    explain:
      '光在真空中走一年的距离，约 9.46 万亿公里。星际距离用它衡量，比邻星距我们约 4.25 光年。',
  },
  {
    term: '时间膨胀',
    explain:
      '相对论效应：速度越快，运动者经历的时间相对外界越慢。你的专注时间 × γ，就是宇宙实际流逝的时间。',
  },
  {
    term: '主观时间 / 宇宙时间',
    explain: '主观时间 = 你感知的专注时长；宇宙时间 = 宇宙中实际经过的时间（= 主观时间 × γ）。',
  },
  {
    term: '航行距离',
    explain: '飞船以速度 v 飞行「主观时间 × γ」后，在宇宙中飞过的实际距离，以光年计量。',
  },
  {
    term: '光谱类型 · OBAFGKM',
    explain:
      '按表面温度给恒星分类：O/B 蓝白（极热）→ A/F/G 白黄 → K/M 橙红（较冷）。太阳是 G 型。星图里星星的颜色就来自光谱。',
  },
  {
    term: '自由漂流',
    explain: '不设目的地，专注多久就飞多远，想停就停。',
  },
];

type GlossaryDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function GlossaryDialog({ open, onClose }: GlossaryDialogProps) {
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
      aria-label="星际航行术语"
    >
      <div
        className="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass-card relative z-10 max-h-[82vh] w-full max-w-md animate-fade-up overflow-y-auto rounded-2xl p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium tracking-wide">星际航行术语</h2>
          <button
            type="button"
            aria-label="关闭"
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
          {GLOSSARY.map((item) => (
            <li key={item.term}>
              <div className="font-display text-sm font-medium text-star-gold">{item.term}</div>
              <p className="mt-1 text-sm leading-relaxed text-deep-300">{item.explain}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full cursor-pointer rounded-xl bg-star-gold font-display text-sm font-medium tracking-wider text-[#0a1032] transition-colors hover:opacity-85"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
