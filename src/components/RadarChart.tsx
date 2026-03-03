import {
    Radar,
    RadarChart as RechartsRadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
    data: Record<string, unknown>[];
    metrics: string[];
}

const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function RadarChart({ data, metrics }: RadarChartProps) {
    if (!data || data.length === 0 || metrics.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground w-full h-[350px]">
                Not enough data or metrics selected for radar chart.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                />
                <PolarRadiusAxis
                    angle={30}
                    domain={["auto", "auto"]}
                    tick={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                        borderRadius: "8px",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                {metrics.map((metric, i) => (
                    <Radar
                        key={metric}
                        name={metric}
                        dataKey={metric}
                        stroke={colors[i % colors.length]}
                        fill={colors[i % colors.length]}
                        fillOpacity={0.4}
                    />
                ))}
            </RechartsRadarChart>
        </ResponsiveContainer>
    );
}
