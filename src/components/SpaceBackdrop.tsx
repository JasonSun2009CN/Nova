import { useEffect, useMemo, useState } from 'react';

type Star = {
  x: number;
  y: number;
  r: number;
  o: number;
  c: number;
  d: number;
};

const STAR_COLORS = ['var(--color-star-white)', 'var(--color-star-blue)', 'var(--color-star-gold)'];

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(Math.random() * 980) / 10,
    y: Math.round(Math.random() * 980) / 10,
    r: 0.4 + Math.random() * 1.1,
    o: 0.3 + Math.random() * 0.6,
    c: i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
    d: Math.round((2 + Math.random() * 4) * 10) / 10,
  }));
}

function blob(className: string, style: React.CSSProperties): React.ReactElement {
  return <div className={className} style={style} />;
}

export function SpaceBackdrop() {
  const stars = useMemo(() => makeStars(90), []);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq == null) return;
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, var(--color-surface-elevated) 0%, var(--color-surface) 55%, var(--color-deep-950) 100%)',
        }}
      />
      {blob(reduced ? '' : 'animate-drift', {
        position: 'absolute',
        left: '-15%',
        top: '-12%',
        width: '60%',
        height: '50%',
        borderRadius: '9999px',
        filter: 'blur(90px)',
        background:
          'radial-gradient(circle, color-mix(in oklab, var(--color-nebula-500) 32%, transparent), transparent 70%)',
        opacity: 0.55,
      })}
      {blob(reduced ? '' : 'animate-drift', {
        position: 'absolute',
        right: '-18%',
        bottom: '-10%',
        width: '65%',
        height: '55%',
        borderRadius: '9999px',
        filter: 'blur(100px)',
        background:
          'radial-gradient(circle, color-mix(in oklab, var(--color-star-blue) 18%, transparent), transparent 70%)',
        opacity: 0.45,
        animationDelay: '-8s',
      })}
      {blob(reduced ? '' : 'animate-drift', {
        position: 'absolute',
        left: '28%',
        top: '32%',
        width: '42%',
        height: '42%',
        borderRadius: '9999px',
        filter: 'blur(110px)',
        background:
          'radial-gradient(circle, color-mix(in oklab, var(--color-star-gold) 12%, transparent), transparent 70%)',
        opacity: 0.3,
        animationDelay: '-16s',
      })}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={STAR_COLORS[s.c]}
            opacity={s.o}
            className={reduced ? '' : 'animate-twinkle'}
            style={{ animationDelay: `${s.d}s` }}
          />
        ))}
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 50%, transparent 62%, color-mix(in srgb, var(--color-deep-950) 20%, transparent) 100%)',
        }}
      />
    </div>
  );
}
