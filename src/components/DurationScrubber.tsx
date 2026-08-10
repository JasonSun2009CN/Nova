const SCRUBBER_MIN = 1;
const SCRUBBER_MAX = 240;
const SCRUBBER_STEP = 1;
const TICK_EVERY = 5;
const TICK_MAJOR_EVERY = 30;

type Tick = {
  value: number;
  major: boolean;
};

function buildTicks(): Tick[] {
  const ticks: Tick[] = [];
  for (let value = SCRUBBER_MIN; value <= SCRUBBER_MAX; value += 1) {
    if (value === SCRUBBER_MIN || value === SCRUBBER_MAX || value % TICK_EVERY === 0) {
      ticks.push({ value, major: value % TICK_MAJOR_EVERY === 0 });
    }
  }
  return ticks;
}

type DurationScrubberProps = {
  value: number;
  onChange: (value: number) => void;
};

export function DurationScrubber({ value, onChange }: DurationScrubberProps) {
  const clamped = Math.min(SCRUBBER_MAX, Math.max(SCRUBBER_MIN, Math.round(value)));
  const pct = ((clamped - SCRUBBER_MIN) / (SCRUBBER_MAX - SCRUBBER_MIN)) * 100;
  const ticks = buildTicks();

  return (
    <div className="select-none">
      <div className="relative flex h-12 w-full items-center">
        <div className="pointer-events-none absolute inset-x-2.5 inset-y-0" aria-hidden="true">
          <div
            data-testid="scrubber-ticks"
            className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2"
          >
            {ticks.map((tick) => {
              const left = ((tick.value - SCRUBBER_MIN) / (SCRUBBER_MAX - SCRUBBER_MIN)) * 100;
              return (
                <span
                  key={tick.value}
                  className={
                    tick.major ? 'absolute h-3 w-px bg-white/35' : 'absolute h-2 w-px bg-white/15'
                  }
                  style={{ left: `${left}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                />
              );
            })}
          </div>
          <div
            data-testid="scrubber-track"
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--color-glass-border)]"
          />
          <div
            data-testid="scrubber-fill"
            className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-star-gold"
            style={{ width: `${pct}%` }}
          />
        </div>

        <input
          type="range"
          id="duration-scrubber"
          aria-label="专注时长滑动条"
          min={SCRUBBER_MIN}
          max={SCRUBBER_MAX}
          step={SCRUBBER_STEP}
          value={clamped}
          onChange={(e) => onChange(Number(e.target.value))}
          className="duration-scrubber relative z-10 h-full w-full"
        />
      </div>
      <div className="flex justify-between px-1 text-[0.625rem] text-deep-400 tabular-nums">
        <span>{SCRUBBER_MIN}</span>
        <span>{SCRUBBER_MAX}</span>
      </div>
    </div>
  );
}
