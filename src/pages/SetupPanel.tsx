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
      className="mx-auto flex w-full max-w-md flex-1 flex-col gap-7 px-5 pb-10 pt-4"
    >
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <span className="text-star-gold">✦</span>
          <span>规划一次星际航行</span>
        </h2>

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
                  'flex h-12 cursor-pointer items-center justify-center rounded-md border text-base font-medium transition-colors duration-200',
                  minutes === p
                    ? 'border-star-gold bg-star-gold/10 text-star-gold shadow-glow-sm'
                    : 'border-border text-deep-200 hover:border-border-strong hover:bg-surface-muted',
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
              className="h-12 w-28 rounded-md border border-border bg-surface-elevated px-3 font-mono text-base text-foreground focus:border-star-blue focus:outline-none"
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
            className="h-12 w-full cursor-pointer rounded-md border border-border bg-surface-elevated px-3 text-base text-foreground focus:border-star-blue focus:outline-none"
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
            className="h-12 w-full cursor-pointer accent-star-gold"
          />
          <p className="text-xs text-deep-500">速度越接近光速，时间膨胀越明显，航行距离越远。</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!valid}
        className={twMerge(
          'flex h-14 w-full cursor-pointer items-center justify-center rounded-lg border text-lg font-semibold tracking-widest transition-colors duration-200',
          valid
            ? 'border-star-gold bg-star-gold/15 text-star-gold shadow-glow hover:bg-star-gold/25'
            : 'cursor-not-allowed border-border text-deep-500',
        )}
      >
        启动航行
      </button>
    </section>
  );
}
