import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

type ThemeKey = 'deep-space' | 'cyberpunk' | 'retro' | 'minimal-light';

const THEME_LABELS: Record<ThemeKey, string> = {
  'deep-space': '深空蓝紫',
  'cyberpunk': '赛博朋克',
  'retro': '复古胶片',
  'minimal-light': '极简白昼',
};

function App() {
  const [theme, setTheme] = useState<ThemeKey>('deep-space');

  const applyTheme = (t: ThemeKey) => {
    document.documentElement.dataset.theme = t;
    setTheme(t);
  };

  return (
    <div
      className={twMerge(
        'min-h-screen w-full bg-surface text-foreground',
        'flex flex-col items-center justify-center gap-10 p-8',
        'transition-colors duration-700',
      )}
    >
      <header className="text-center space-y-3">
        <div className="relative inline-block">
          <h1
            className="text-5xl font-bold tracking-[0.3em] animate-pulse-slow"
            style={{
              background:
                'linear-gradient(135deg, var(--color-star-gold), var(--color-star-white) 50%, var(--color-star-blue))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            NOVA
          </h1>
          <div
            className="absolute -inset-8 -z-10 blur-3xl opacity-60 rounded-full animate-float-slow"
            style={{
              background: 'radial-gradient(circle, var(--color-nebula-500) 0%, transparent 70%)',
            }}
          />
        </div>
        <p className="text-deep-300 font-mono text-sm tracking-wider">─── 星 · 际 · 专 · 注 ───</p>
        <p className="text-deep-400 max-w-md text-sm leading-relaxed">
          让每一次专注，都成为一次跨越星海的旅程。
          <br />
          真实宇宙结构 · 相对论时间膨胀 · 沉浸式航行体验
        </p>
      </header>

      <section className="w-full max-w-xl rounded-lg border border-border bg-surface-muted/40 backdrop-blur-sm p-6 shadow-card">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span className="text-star-gold">✦</span>
          <span>脚手架验证</span>
        </h2>
        <div className="space-y-4 text-sm">
          <StatusRow label="React 18 + TypeScript" ok />
          <StatusRow label="Vite 5 (原生 ESM)" ok />
          <StatusRow label="Tailwind CSS + CSS Variables" ok />
          <StatusRow label="路径别名 @/engine, @/hooks..." ok />
          <StatusRow label="引擎/UI 低耦合分层" ok />
        </div>
      </section>

      <section className="w-full max-w-xl rounded-lg border border-border bg-surface-elevated p-6 shadow-card">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <span className="text-star-blue">✦</span>
          <span>主题切换 Demo (S6)</span>
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(THEME_LABELS) as ThemeKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => applyTheme(k)}
              className={twMerge(
                'px-4 py-3 rounded-md border text-left transition-all',
                theme === k
                  ? 'border-star-gold bg-star-gold/10 shadow-glow-sm'
                  : 'border-border hover:border-star-blue/50 hover:bg-surface-muted',
              )}
            >
              <div className="flex gap-2 mb-2">
                <ThemeSwatch themeKey={k} />
              </div>
              <div className="text-sm font-medium">{THEME_LABELS[k]}</div>
              <div className="font-mono text-[10px] text-deep-400 mt-1">{k}</div>
            </button>
          ))}
        </div>
      </section>

      <footer className="pt-8 text-xs text-deep-500 font-mono">
        v0.0.1-pre-alpha · engine-first roadmap · build {new Date().toISOString().slice(0, 10)}
      </footer>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-deep-200">{label}</span>
      <span className={twMerge('font-mono text-xs', ok ? 'text-emerald-400' : 'text-rose-400')}>
        {ok ? '● READY' : '○ PENDING'}
      </span>
    </div>
  );
}

function ThemeSwatch({ themeKey }: { themeKey: ThemeKey }) {
  const palettes: Record<ThemeKey, string[]> = {
    'deep-space': ['#0A0E27', '#1A0F3D', '#FFD700', '#8ab4ff'],
    'cyberpunk': ['#0d0221', '#f20089', '#2de2e6', '#f6019d'],
    'retro': ['#f4e8d0', '#c89f6a', '#8a5a2b', '#2a1810'],
    'minimal-light': ['#fafafa', '#ffffff', '#2563eb', '#111827'],
  };
  return (
    <>
      {palettes[themeKey].map((c, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-full border border-black/20"
          style={{ background: c }}
        />
      ))}
    </>
  );
}

export default App;
