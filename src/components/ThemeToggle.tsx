import { twMerge } from 'tailwind-merge';

import type { ThemeKey } from '@/contract/storage-types';
import { useSettingsStore } from '@/store/useSettingsStore';

const THEME_OPTIONS: readonly { key: ThemeKey; label: string }[] = [
  { key: 'deep-space', label: '深空' },
  { key: 'cyberpunk', label: '赛博朋克' },
  { key: 'retro', label: '复古' },
  { key: 'minimal-light', label: '极简白' },
];

function ThemeGlyph({ themeKey }: { themeKey: ThemeKey }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'h-5 w-5',
  } as const;

  switch (themeKey) {
    case 'deep-space':
      return (
        <svg {...common}>
          <path d="M12 3l2.5 5.7 6.2.6-4.6 4.2 1.3 6.1L12 16.8l-5.4 2.8 1.3-6.1L3.3 9.3l6.2-.6z" />
        </svg>
      );
    case 'cyberpunk':
      return (
        <svg {...common}>
          <path d="M13 3L5 14h6l-1 7 8-11h-6z" />
        </svg>
      );
    case 'retro':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M7 12h10" />
        </svg>
      );
    case 'minimal-light':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
  }
}

export function ThemeToggle() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div role="group" aria-label="主题切换" className="flex items-center gap-1.5">
      {THEME_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          aria-label={opt.label}
          aria-pressed={theme === opt.key}
          title={opt.label}
          onClick={() => void setTheme(opt.key)}
          className={twMerge(
            'flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200',
            theme === opt.key
              ? 'border-star-gold/60 bg-star-gold/15 text-star-gold shadow-glow-sm'
              : 'border-[var(--color-glass-border)] bg-[var(--color-glass)] text-deep-400 hover:text-foreground',
          )}
        >
          <ThemeGlyph themeKey={opt.key} />
        </button>
      ))}
    </div>
  );
}
