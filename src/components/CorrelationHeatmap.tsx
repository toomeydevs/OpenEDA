import { useMemo } from "react";

interface Props {
  columns: string[];
  matrix: number[][];
}

export default function CorrelationHeatmap({ columns, matrix }: Props) {
  const cellSize = Math.min(60, Math.max(36, 500 / columns.length));

  const getColor = (val: number) => {
    if (val >= 0) {
      const intensity = Math.round(val * 100);
      return `hsl(213, 72%, ${95 - intensity * 0.5}%)`;
    } else {
      const intensity = Math.round(Math.abs(val) * 100);
      return `hsl(0, 72%, ${95 - intensity * 0.5}%)`;
    }
  };

  return (
    <div className="rounded-xl bg-card shadow-card border border-border p-6 overflow-x-auto">
      <h3 className="text-sm font-semibold text-foreground mb-4">Correlation Matrix</h3>
      <div className="inline-block">
        <div className="flex">
          <div style={{ width: cellSize * 2 }} />
          {columns.map((col) => (
            <div
              key={col}
              style={{ width: cellSize }}
              className="text-[10px] font-mono text-muted-foreground text-center truncate px-0.5"
              title={col}
            >
              {col.length > 8 ? col.slice(0, 7) + "…" : col}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={columns[i]} className="flex items-center">
            <div
              style={{ width: cellSize * 2 }}
              className="text-[10px] font-mono text-muted-foreground text-right pr-2 truncate"
              title={columns[i]}
            >
              {columns[i].length > 12 ? columns[i].slice(0, 11) + "…" : columns[i]}
            </div>
            {row.map((val, j) => (
              <div
                key={j}
                style={{ width: cellSize, height: cellSize, background: getColor(val) }}
                className="flex items-center justify-center text-[10px] font-mono border border-background/50"
                title={`${columns[i]} × ${columns[j]}: ${val.toFixed(3)}`}
              >
                {val.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ background: "hsl(0, 72%, 55%)" }} />
          <span>Negative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted" />
          <span>Zero</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ background: "hsl(213, 72%, 55%)" }} />
          <span>Positive</span>
        </div>
      </div>
    </div>
  );
}
