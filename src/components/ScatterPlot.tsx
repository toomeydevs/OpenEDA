import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Record<string, unknown>[];
  xCol: string;
  yCol: string;
}

export default function ScatterPlot({ data, xCol, yCol }: Props) {
  const points = useMemo(() => {
    return data
      .map((row) => ({
        x: Number(row[xCol]),
        y: Number(row[yCol]),
      }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y))
      .slice(0, 2000); // cap for performance
  }, [data, xCol, yCol]);

  return (
    <div className="rounded-xl bg-card shadow-card border border-border p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {yCol} vs {xCol}
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="x"
            name={xCol}
            type="number"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            label={{ value: xCol, position: "bottom", offset: 20, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
          />
          <YAxis
            dataKey="y"
            name={yCol}
            type="number"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => value.toFixed(2)}
          />
          <Scatter data={points} fill="hsl(var(--primary))" fillOpacity={0.6} r={3} />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {points.length.toLocaleString()} data points{points.length === 2000 ? " (capped at 2,000)" : ""}
      </p>
    </div>
  );
}
