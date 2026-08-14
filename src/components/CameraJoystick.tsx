import { useRef, useState, type PointerEvent } from 'react';

export type JoystickVector = { x: number; y: number };

const PAD = 52;
const TRAVEL = 30;

type CameraJoystickProps = {
  joystickRef: { current: JoystickVector };
  ariaLabel: string;
};

export function CameraJoystick({ joystickRef, ariaLabel }: CameraJoystickProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (pad == null) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let nx = (clientX - cx) / PAD;
    let ny = (clientY - cy) / PAD;
    const mag = Math.hypot(nx, ny);
    if (mag > 1) {
      nx /= mag;
      ny /= mag;
    }
    joystickRef.current = { x: nx, y: -ny };
    setKnob({ x: nx * TRAVEL, y: ny * TRAVEL });
  };

  const reset = () => {
    draggingRef.current = false;
    joystickRef.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    update(event.clientX, event.clientY);
  };

  return (
    <div
      ref={padRef}
      data-testid="camera-joystick"
      role="application"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={reset}
      onPointerCancel={reset}
      className="glass-card relative h-24 w-24 cursor-pointer touch-none select-none rounded-full"
    >
      <div
        className="pointer-events-none absolute inset-3 rounded-full border border-[var(--color-glass-border)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <span className="h-1 w-1 rounded-full bg-white/25" />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-9 w-9 rounded-full border border-star-gold/60 bg-star-gold/15 backdrop-blur-sm"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
