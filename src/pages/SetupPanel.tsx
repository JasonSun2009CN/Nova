import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { DESTINATION_STARS } from '@/data/destination-stars';
import { LIGHT_SPEED, lorentzFactor } from '@/engine';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import { formatGamma, formatLy, formatMinuteLabel, formatVOverC } from '@/utils/format';

const PRESETS = [5, 15, 25, 45] as const;

export function SetupPanel() {
  const defaultMinutes = useSettingsStore((s) => s.settings.defaultFocusMinutes);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const defaultVOverC = useSettingsStore((s) => s.settings.defaultVOverC);

  const [minutes, setMinutes] = useState<number>(defaultMinutes);
  const [vOverC, setVOverC] = useState<number>(defaultVOverC);
  const [destStarId, setDestStarId] = useState<string | null>(null);
  const touchedRef = useRef(false);

  useEffect(() => {
    if (hydrated && !touchedRef.current) {
      setMinutes(defaultMinutes);
    }
  }, [hydrated, defaultMinutes]);

  const valid = Number.isFinite(minutes) && minutes > 0;
  const gamma = lorentzFactor(vOverC * LIGHT_SPEED);
  const destStar = DESTINATION_STARS.find((s) => s.id === destStarId) ?? null;

  const handleCustomChange = (raw: string) => {
    touchedRef.current = true;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      setMinutes(Math.round(n));
    }
  };

  const handlePreset = (p: number) => {
    touchedRef.current = true;
    setMinutes(p);
  };

  const handleDestChange = (value: string) => {
    const next = value === '' ? null : value;
    setDestStarId(next);
    useVoyageStore.getState().selectDestination(next);
  };

  const handleStart = () => {
    if (!valid) return;
    useVoyageStore.getState().prepare({
      focusMinutes: minutes,
      vOverC,
      originStarId: 'hip-sol',
      destStarId,
    });
    useVoyageStore.getState().start();
  };

  return (
    <section
      data-testid="setup-panel"
      className="mx-auto flex w-full max-w-md animate-fade-up flex-1 flex-col gap-5 px-5 pb-10 pt-4"
    >
      <div className="glass-card space-y-7 rounded-2xl p-6 shadow-glass">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-wide">规划一次星际航行</h2>
          <p className="mt-1 text-xs text-deep-400">设定专注时长，飞船将从太阳系出发</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-glass-border)] bg-surface-muted/30 px-4 py-3">
          <div className="w-16 shrink-0 text-center">
            <div className="text-[10px] uppercase tracking-wider text-deep-400">起点</div>
            <div className="mt-0.5 font-display text-sm text-foreground">太阳系</div>
          </div>
          <div className="relative flex-1">
            <div className="border-t border-dashed border-star-gold/40" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-star-gold"
              aria-hidden="true"
            >
              <path d="M12 2l2.5 5.7 6.2.6-4.6 4.2 1.3 6.1L12 16.8l-5.4 2.8 1.3-6.1L3.3 9.3l6.2-.6z" />
            </svg>
          </div>
          <div className="w-24 shrink-0 text-center">
            <div className="text-[10px] uppercase tracking-wider text-deep-400">目的地</div>
            <div className="mt-0.5 truncate font-display text-sm text-foreground">
              {destStar?.name ?? '自由漂流'}
            </div>
          </div>
        </div>
        <p className="-mt-4 text-center font-mono text-xs text-star-gold">
          {destStar != null ? `${formatLy(destStar.distanceLy)} 航程` : '无固定航线 · 自由探索'}
        </p>

        <div>
          <label id="focus-minutes-label" className="mb-2 block text-sm text-deep-300">
            专注时长
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={minutes === p}
                aria-label={`${p} 分钟`}
                onClick={() => handlePreset(p)}
                className={twMerge(
                  'flex h-12 cursor-pointer items-center justify-center rounded-xl font-display text-base transition-all duration-200',
                  minutes === p
                    ? 'border border-star-gold/60 bg-star-gold/15 text-star-gold shadow-glow-sm'
                    : 'border border-[var(--color-glass-border)] bg-[var(--color-glass)] text-deep-200 hover:border-star-gold/40 hover:text-foreground',
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={minutes}
              aria-label="自定义专注时长（分钟）"
              onChange={(e) => handleCustomChange(e.target.value)}
              className="h-12 w-28 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 font-mono text-base text-foreground backdrop-blur focus:border-star-blue focus:outline-none"
            />
            <span className="text-sm text-deep-400">{formatMinuteLabel(minutes)}</span>
          </div>
        </div>

        <div>
          <label htmlFor="dest-star" className="mb-2 block text-sm text-deep-300">
            目的地
          </label>
          <select
            id="dest-star"
            value={destStarId ?? ''}
            onChange={(e) => handleDestChange(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 text-base text-foreground backdrop-blur focus:border-star-blue focus:outline-none"
          >
            <option value="">（无目的地 · 自由漂流）</option>
            {DESTINATION_STARS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {formatLy(s.distanceLy)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="v-slider"
            className="mb-2 flex items-center justify-between text-sm text-deep-300"
          >
            <span>航行速度</span>
            <span className="font-mono text-deep-200">
              {formatVOverC(vOverC)} · γ {formatGamma(gamma)}
            </span>
          </label>
          <input
            id="v-slider"
            type="range"
            min={0.5}
            max={0.999}
            step={0.001}
            value={vOverC}
            aria-label="航行速度 v/c"
            onChange={(e) => setVOverC(Number(e.target.value))}
            className="h-12 w-full cursor-pointer accent-[var(--color-star-gold)]"
          />
          <p className="text-xs text-deep-500">速度越接近光速，时间膨胀越明显，航行距离越远。</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!valid}
        className={twMerge(
          'h-14 w-full rounded-xl font-display text-lg font-semibold tracking-widest transition-all duration-200',
          valid
            ? 'bg-star-gold text-[#0a1032] shadow-glow hover:shadow-glow-lg hover:brightness-110 active:scale-[0.99]'
            : 'cursor-not-allowed border border-[var(--color-glass-border)] text-deep-500',
        )}
      >
        启动航行
      </button>
    </section>
  );
}
