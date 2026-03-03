import { useState, useMemo } from "react";
import { Trash2, Eraser, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { analyzeDataset, ColumnInfo } from "@/lib/dataAnalysis";
import { toast } from "sonner";

export default function DataCleaningTools() {
  const { dataset, setDataset } = useData();
  const [fillColumn, setFillColumn] = useState("");
  const [fillStrategy, setFillStrategy] = useState<"mean" | "median" | "mode">("mean");

  const numCols = useMemo(
    () => dataset?.columnInfos.filter((c) => c.type === "numerical").map((c) => c.name) ?? [],
    [dataset]
  );
  const allCols = useMemo(() => dataset?.columnInfos.map((c) => c.name) ?? [], [dataset]);
  const missingCount = useMemo(
    () => dataset?.columnInfos.reduce((sum, c) => sum + c.nullCount, 0) ?? 0,
    [dataset]
  );
  const duplicateCount = useMemo(() => {
    if (!dataset) return 0;
    const seen = new Set<string>();
    let dupes = 0;
    for (const row of dataset.data) {
      const key = JSON.stringify(row);
      if (seen.has(key)) dupes++;
      else seen.add(key);
    }
    return dupes;
  }, [dataset]);

  if (!dataset) return null;

  const updateData = (newData: Record<string, unknown>[]) => {
    const info = analyzeDataset(newData);
    setDataset(info);
  };

  const dropRowsWithMissing = () => {
    const cleaned = dataset.data.filter((row) =>
      Object.values(row).every((v) => v !== null && v !== undefined && v !== "")
    );
    const removed = dataset.data.length - cleaned.length;
    updateData(cleaned);
    toast.success(`Removed ${removed} rows with missing values.`);
  };

  const removeDuplicates = () => {
    const seen = new Set<string>();
    const cleaned = dataset.data.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const removed = dataset.data.length - cleaned.length;
    updateData(cleaned);
    toast.success(`Removed ${removed} duplicate rows.`);
  };

  const fillMissing = () => {
    if (!fillColumn) return;
    const col = dataset.columnInfos.find((c) => c.name === fillColumn);
    if (!col) return;

    let fillValue: unknown;
    if (col.type === "numerical") {
      const nums = dataset.data.map((r) => Number(r[fillColumn])).filter((n) => !isNaN(n)).sort((a, b) => a - b);
      if (fillStrategy === "mean") fillValue = nums.reduce((a, b) => a + b, 0) / nums.length;
      else if (fillStrategy === "median") {
        const mid = Math.floor(nums.length / 2);
        fillValue = nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      } else {
        const freq: Record<number, number> = {};
        for (const n of nums) freq[n] = (freq[n] || 0) + 1;
        fillValue = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0);
      }
    } else {
      // mode for categorical
      const freq: Record<string, number> = {};
      for (const r of dataset.data) {
        const v = r[fillColumn];
        if (v !== null && v !== undefined && v !== "") {
          const s = String(v);
          freq[s] = (freq[s] || 0) + 1;
        }
      }
      fillValue = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    }

    const cleaned = dataset.data.map((row) => {
      const v = row[fillColumn];
      if (v === null || v === undefined || v === "") {
        return { ...row, [fillColumn]: fillValue };
      }
      return row;
    });
    const filled = cleaned.filter(
      (r, i) => r[fillColumn] !== dataset.data[i][fillColumn]
    ).length;
    updateData(cleaned);
    toast.success(`Filled ${filled} missing values in "${fillColumn}" with ${fillStrategy} (${typeof fillValue === 'number' ? fillValue.toFixed(2) : fillValue}).`);
  };

  const exportCSV = () => {
    const headers = allCols.join(",");
    const rows = dataset.data.map((row) =>
      allCols.map((col) => {
        const v = row[col];
        if (v === null || v === undefined) return "";
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned-data.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-card shadow-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Rows</p>
          <p className="text-xl font-bold text-foreground">{dataset.rows.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card shadow-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Missing Values</p>
          <p className="text-xl font-bold text-foreground">
            {missingCount.toLocaleString()}
            {missingCount > 0 && <Badge variant="outline" className="ml-2 text-destructive border-destructive/20">needs attention</Badge>}
          </p>
        </div>
        <div className="rounded-xl bg-card shadow-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Duplicate Rows</p>
          <p className="text-xl font-bold text-foreground">{duplicateCount.toLocaleString()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Drop missing */}
        <div className="rounded-xl bg-card shadow-card border border-border p-4 sm:p-5 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Drop Rows with Missing Values</h4>
          <p className="text-xs text-muted-foreground">Remove all rows that contain at least one missing value.</p>
          <Button variant="destructive" size="sm" className="gap-2" onClick={dropRowsWithMissing} disabled={missingCount === 0}>
            <Trash2 className="h-3.5 w-3.5" /> Drop {missingCount > 0 ? `(affects up to ${missingCount} cells)` : "(none found)"}
          </Button>
        </div>

        {/* Remove duplicates */}
        <div className="rounded-xl bg-card shadow-card border border-border p-4 sm:p-5 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Remove Duplicates</h4>
          <p className="text-xs text-muted-foreground">Remove exact duplicate rows from the dataset.</p>
          <Button variant="destructive" size="sm" className="gap-2" onClick={removeDuplicates} disabled={duplicateCount === 0}>
            <Eraser className="h-3.5 w-3.5" /> Remove {duplicateCount} duplicates
          </Button>
        </div>

        {/* Fill missing */}
        <div className="rounded-xl bg-card shadow-card border border-border p-4 sm:p-5 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Fill Missing Values</h4>
          <p className="text-xs text-muted-foreground">Replace missing values in a column with mean, median, or mode.</p>
          <div className="flex flex-wrap gap-2">
            <Select value={fillColumn} onValueChange={setFillColumn}>
              <SelectTrigger className="w-full sm:w-40 bg-card text-xs h-8">
                <SelectValue placeholder="Column" />
              </SelectTrigger>
              <SelectContent>
                {allCols.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fillStrategy} onValueChange={(v) => setFillStrategy(v as any)}>
              <SelectTrigger className="w-full sm:w-28 bg-card text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mean">Mean</SelectItem>
                <SelectItem value="median">Median</SelectItem>
                <SelectItem value="mode">Mode</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={fillMissing} disabled={!fillColumn}>
              Fill
            </Button>
          </div>
        </div>

        {/* Export CSV */}
        <div className="rounded-xl bg-card shadow-card border border-border p-4 sm:p-5 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Export to CSV</h4>
          <p className="text-xs text-muted-foreground">Download the current (cleaned) dataset as a CSV file.</p>
          <Button size="sm" className="gap-2" onClick={exportCSV}>
            <ArrowDownToLine className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
