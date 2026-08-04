export function SpaceBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, var(--color-surface-elevated) 0%, var(--color-surface) 58%)',
        }}
      />
    </div>
  );
}
