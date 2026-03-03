import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import {
  computeSummaryStats,
  computeMissingValues,
  computeCorrelation,
  getDistributionData,
  getCategoricalDistribution,
  getBoxPlotData,
} from "@/lib/dataAnalysis";
import BoxPlotChart from "@/components/BoxPlotChart";
import ScatterPlot from "@/components/ScatterPlot";
import DataCleaningTools from "@/components/DataCleaningTools";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import CorrelationHeatmap from "@/components/CorrelationHeatmap";

export default function VisualizationPage() {
  const { dataset } = useData();
  const navigate = useNavigate();
  const [selectedCol, setSelectedCol] = useState<string>("");
  const [scatterX, setScatterX] = useState<string>("");
  const [scatterY, setScatterY] = useState<string>("");

  const summaryStats = useMemo(
    () => (dataset ? computeSummaryStats(dataset.data, dataset.columnInfos) : []),
    [dataset]
  );
  const missingValues = useMemo(
    () => (dataset ? computeMissingValues(dataset.data, dataset.columnInfos) : []),
    [dataset]
  );
  const correlation = useMemo(
    () => (dataset ? computeCorrelation(dataset.data, dataset.columnInfos) : { columns: [], matrix: [] }),
    [dataset]
  );

  const numCols = useMemo(
    () => (dataset ? dataset.columnInfos.filter((c) => c.type === "numerical").map((c) => c.name) : []),
    [dataset]
  );
  const catCols = useMemo(
    () => (dataset ? dataset.columnInfos.filter((c) => c.type === "categorical").map((c) => c.name) : []),
    [dataset]
  );

  const allDistCols = useMemo(() => [...numCols, ...catCols], [numCols, catCols]);
  const activeCol = selectedCol || numCols[0] || catCols[0] || "";

  const activeScatterX = scatterX || numCols[0] || "";
  const activeScatterY = scatterY || numCols[1] || numCols[0] || "";

  const isNumerical = useMemo(
    () => dataset?.columnInfos.find((c) => c.name === activeCol)?.type === "numerical",
    [dataset, activeCol]
  );

  const distributionData = useMemo(() => {
    if (!activeCol || !dataset) return [];
    if (isNumerical) return getDistributionData(dataset.data, activeCol);
    return getCategoricalDistribution(dataset.data, activeCol);
  }, [dataset, activeCol, isNumerical]);

  const boxPlotData = useMemo(() => {
    if (!activeCol || !dataset || !isNumerical) return null;
    return getBoxPlotData(dataset.data, activeCol);
  }, [dataset, activeCol, isNumerical]);

  const missingWithData = useMemo(() => missingValues.filter((m) => m.missing > 0), [missingValues]);

  if (!dataset) {
    navigate("/");
    return null;
  }

  const fmt = (n: number) => {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
    return n % 1 === 0 ? String(n) : n.toFixed(2);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Visualizations</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Explore summary statistics, distributions, correlations, and missing values.</p>
      </motion.div>

      <Tabs defaultValue="summary" className="space-y-4 sm:space-y-6">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="summary" className="text-xs sm:text-sm">Summary</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs sm:text-sm">Distributions</TabsTrigger>
          <TabsTrigger value="scatter" className="text-xs sm:text-sm">Scatter</TabsTrigger>
          <TabsTrigger value="correlation" className="text-xs sm:text-sm">Correlation</TabsTrigger>
          <TabsTrigger value="missing" className="text-xs sm:text-sm">Missing</TabsTrigger>
          <TabsTrigger value="cleaning" className="text-xs sm:text-sm">Cleaning</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {summaryStats.length === 0 ? (
            <p className="text-muted-foreground">No numerical columns found.</p>
          ) : (
            <div className="rounded-xl bg-card shadow-card border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Column", "Count", "Mean", "Std", "Min", "25%", "50%", "75%", "Max"].map((h) => (
                      <th key={h} className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs sm:text-sm">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryStats.map((s) => (
                    <tr key={s.column} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-xs">{s.column}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs sm:text-sm">{fmt(s.count)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{fmt(s.mean)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs sm:text-sm">{fmt(s.std)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{fmt(s.min)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs sm:text-sm">{fmt(s.q25)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{fmt(s.median)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs sm:text-sm">{fmt(s.q75)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{fmt(s.max)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          {allDistCols.length === 0 ? (
            <p className="text-muted-foreground">No columns to visualize.</p>
          ) : (
            <>
              <Select value={activeCol} onValueChange={setSelectedCol}>
                <SelectTrigger className="w-full sm:w-64 bg-card">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {allDistCols.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="rounded-xl bg-card shadow-card border border-border p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {isNumerical ? "Histogram" : "Category Counts"}: {activeCol}
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey={isNumerical ? "bin" : "category"}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distributionData.map((_, i) => (
                        <Cell key={i} fill={isNumerical ? "hsl(var(--primary))" : "hsl(var(--accent))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {boxPlotData && (
                <div className="rounded-xl bg-card shadow-card border border-border p-4 sm:p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Box Plot: {activeCol}
                  </h3>
                  <BoxPlotChart data={boxPlotData} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="scatter" className="space-y-4">
          {numCols.length < 2 ? (
            <p className="text-muted-foreground">Need at least 2 numerical columns for scatter plot.</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Select value={activeScatterX} onValueChange={setScatterX}>
                  <SelectTrigger className="w-full sm:w-48 bg-card">
                    <SelectValue placeholder="X axis" />
                  </SelectTrigger>
                  <SelectContent>
                    {numCols.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground self-center hidden sm:block">vs</span>
                <Select value={activeScatterY} onValueChange={setScatterY}>
                  <SelectTrigger className="w-full sm:w-48 bg-card">
                    <SelectValue placeholder="Y axis" />
                  </SelectTrigger>
                  <SelectContent>
                    {numCols.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ScatterPlot data={dataset.data} xCol={activeScatterX} yCol={activeScatterY} />
            </>
          )}
        </TabsContent>

        <TabsContent value="correlation">
          {correlation.columns.length < 2 ? (
            <p className="text-muted-foreground">Need at least 2 numerical columns for correlation.</p>
          ) : (
            <CorrelationHeatmap columns={correlation.columns} matrix={correlation.matrix} />
          )}
        </TabsContent>

        <TabsContent value="missing">
          {missingWithData.length === 0 ? (
            <div className="rounded-xl bg-card shadow-card border border-border p-8 text-center">
              <p className="text-accent font-semibold">✓ No missing values found!</p>
            </div>
          ) : (
            <div className="rounded-xl bg-card shadow-card border border-border p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={Math.max(200, missingWithData.length * 36)}>
                <BarChart data={missingWithData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    dataKey="column"
                    type="category"
                    width={100}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    formatter={(val: number, _name: string, props: any) => [
                      `${val} (${props.payload.percentage.toFixed(1)}%)`,
                      "Missing",
                    ]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="missing" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cleaning">
          <DataCleaningTools />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={() => navigate("/report")} className="gap-2">
          Generate Report <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
