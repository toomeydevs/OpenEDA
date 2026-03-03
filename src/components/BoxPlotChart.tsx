import { useMemo } from "react";
import { BoxPlotData } from "@/lib/dataAnalysis";

interface BoxPlotChartProps {
  data: BoxPlotData;
}

export default function BoxPlotChart({ data }: BoxPlotChartProps) {
  const layout = useMemo(() => {
    const allValues = [data.min, data.max, ...data.outliers];
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const padding = (dataMax - dataMin) * 0.1 || 1;
    const rangeMin = dataMin - padding;
    const rangeMax = dataMax + padding;
    const range = rangeMax - rangeMin;

    const toPercent = (v: number) => ((v - rangeMin) / range) * 100;

    return { rangeMin, rangeMax, toPercent };
  }, [data]);

  const { toPercent } = layout;

  const boxLeft = toPercent(data.q1);
  const boxRight = toPercent(data.q3);
  const medianPos = toPercent(data.median);
  const whiskerLeft = toPercent(data.min);
  const whiskerRight = toPercent(data.max);

  const ticks = useMemo(() => {
    const vals = [data.min, data.q1, data.median, data.q3, data.max];
    return [...new Set(vals.map((v) => ({ value: v, pos: toPercent(v) })))];
  }, [data, toPercent]);

  const fmt = (n: number) => {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n % 1 === 0 ? String(n) : n.toFixed(2);
  };

  return (
    <div className="w-full">
      {/* Box plot area */}
      <div className="relative h-20 mx-8">
        {/* Whisker line */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-muted-foreground"
          style={{ left: `${whiskerLeft}%`, width: `${whiskerRight - whiskerLeft}%` }}
        />

        {/* Left whisker cap */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[2px] h-6 bg-muted-foreground"
          style={{ left: `${whiskerLeft}%` }}
        />

        {/* Right whisker cap */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[2px] h-6 bg-muted-foreground"
          style={{ left: `${whiskerRight}%` }}
        />

        {/* IQR Box */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-12 rounded-md border-2 border-primary bg-primary/20"
          style={{ left: `${boxLeft}%`, width: `${boxRight - boxLeft}%` }}
        />

        {/* Median line */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[3px] h-12 bg-accent rounded-full"
          style={{ left: `${medianPos}%` }}
        />

        {/* Outliers */}
        {data.outliers.map((o, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-destructive"
            style={{ left: `${toPercent(o)}%`, marginLeft: "-4px", marginTop: "-4px", top: "50%" }}
            title={`Outlier: ${fmt(o)}`}
          />
        ))}
      </div>

      {/* Axis ticks */}
      <div className="relative h-6 mx-8">
        {ticks.map((t, i) => (
          <span
            key={i}
            className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
            style={{ left: `${t.pos}%` }}
          >
            {fmt(t.value)}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-2 border-primary bg-primary/20" /> IQR (Q1–Q3)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-[3px] rounded-full bg-accent" /> Median
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-[2px] bg-muted-foreground" /> Whiskers
        </span>
        {data.outliers.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive" /> Outliers ({data.outliers.length})
          </span>
        )}
      </div>
    </div>
  );
}
