import type { HeatmapCell } from '@/engine/stats/captains-log';

const HEAT_COLORS: readonly [string, string, string, string, string] = [
  'var(--color-deep-800)',
  'rgba(255,215,0,0.20)',
  'rgba(255,215,0,0.45)',
  'rgba(255,215,0,0.72)',
  'var(--color-star-gold)',
];

function cellDate(cell: HeatmapCell): string {
  const d = new Date(cell.dayStartMs);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function HeatmapGrid({ cells }: { cells: readonly HeatmapCell[] }) {
  const weekCount = cells.length / 7;
  const columns: HeatmapCell[][] = [];
  for (let col = 0; col < weekCount; col += 1) {
    columns.push(cells.slice(col * 7, col * 7 + 7));
  }
  const columnMonths = columns.map((col) => new Date(col[0]!.dayStartMs).getMonth());

  return (
    <div className="glass-card rounded-2xl px-4 py-4">
      <div className="flex gap-[3px] overflow-x-auto">
        {columns.map((col, colIdx) => {
          const showLabel = colIdx === 0 || columnMonths[colIdx]! !== columnMonths[colIdx - 1]!;
          return (
            <div key={colIdx} className="flex flex-col gap-[3px]">
              <div className="h-3 text-[9px] leading-3 text-deep-400">
                {showLabel ? `${columnMonths[colIdx]! + 1}月` : ''}
              </div>
              {col.map((cell) => (
                <div
                  key={cell.dayStartMs}
                  title={`${cellDate(cell)} · ${Math.round(cell.minutes)} 分钟`}
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ background: HEAT_COLORS[cell.level] }}
                />
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-1 text-[10px] text-deep-400">
        <span>少</span>
        {HEAT_COLORS.map((color) => (
          <div key={color} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: color }} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
