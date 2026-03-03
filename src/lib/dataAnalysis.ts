export interface ColumnInfo {
  name: string;
  type: "numerical" | "categorical" | "date" | "unknown";
  nonNullCount: number;
  nullCount: number;
  uniqueCount: number;
}

export interface SummaryStats {
  column: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
}

export interface MissingValueInfo {
  column: string;
  missing: number;
  total: number;
  percentage: number;
}

export interface DatasetInfo {
  rows: number;
  columns: number;
  columnInfos: ColumnInfo[];
  data: Record<string, unknown>[];
}

export function detectColumnType(values: unknown[]): ColumnInfo["type"] {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "unknown";

  let numCount = 0;
  let dateCount = 0;

  for (const v of nonNull.slice(0, 100)) {
    const str = String(v).trim();
    if (!isNaN(Number(str)) && str !== "") {
      numCount++;
    } else if (!isNaN(Date.parse(str)) && str.length > 4) {
      dateCount++;
    }
  }

  const sample = Math.min(nonNull.length, 100);
  if (numCount / sample > 0.8) return "numerical";
  if (dateCount / sample > 0.8) return "date";
  return "categorical";
}

export function analyzeDataset(data: Record<string, unknown>[]): DatasetInfo {
  if (data.length === 0) return { rows: 0, columns: 0, columnInfos: [], data: [] };

  const columns = Object.keys(data[0]);
  const columnInfos: ColumnInfo[] = columns.map((col) => {
    const values = data.map((row) => row[col]);
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
    const type = detectColumnType(values);
    return {
      name: col,
      type,
      nonNullCount: nonNull.length,
      nullCount: values.length - nonNull.length,
      uniqueCount: new Set(nonNull.map(String)).size,
    };
  });

  return { rows: data.length, columns: columns.length, columnInfos, data };
}

export function computeSummaryStats(data: Record<string, unknown>[], columnInfos: ColumnInfo[]): SummaryStats[] {
  return columnInfos
    .filter((c) => c.type === "numerical")
    .map((col) => {
      const nums = data
        .map((row) => Number(row[col.name]))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

      if (nums.length === 0) {
        return { column: col.name, count: 0, mean: 0, std: 0, min: 0, q25: 0, median: 0, q75: 0, max: 0 };
      }

      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((sum, n) => sum + (n - mean) ** 2, 0) / nums.length;
      const std = Math.sqrt(variance);

      const percentile = (arr: number[], p: number) => {
        const idx = (p / 100) * (arr.length - 1);
        const lower = Math.floor(idx);
        const frac = idx - lower;
        return arr[lower] + (arr[Math.min(lower + 1, arr.length - 1)] - arr[lower]) * frac;
      };

      return {
        column: col.name,
        count: nums.length,
        mean,
        std,
        min: nums[0],
        q25: percentile(nums, 25),
        median: percentile(nums, 50),
        q75: percentile(nums, 75),
        max: nums[nums.length - 1],
      };
    });
}

export function computeMissingValues(data: Record<string, unknown>[], columnInfos: ColumnInfo[]): MissingValueInfo[] {
  return columnInfos.map((col) => ({
    column: col.name,
    missing: col.nullCount,
    total: data.length,
    percentage: data.length > 0 ? (col.nullCount / data.length) * 100 : 0,
  }));
}

export function computeCorrelation(data: Record<string, unknown>[], columnInfos: ColumnInfo[]): { columns: string[]; matrix: number[][] } {
  const numCols = columnInfos.filter((c) => c.type === "numerical").map((c) => c.name);
  const vectors = numCols.map((col) => data.map((row) => Number(row[col])));

  const matrix: number[][] = numCols.map((_, i) =>
    numCols.map((_, j) => {
      const x = vectors[i];
      const y = vectors[j];
      const n = x.length;
      const validPairs = x.map((xi, k) => [xi, y[k]] as [number, number]).filter(([a, b]) => !isNaN(a) && !isNaN(b));
      if (validPairs.length < 2) return 0;

      const mx = validPairs.reduce((s, [a]) => s + a, 0) / validPairs.length;
      const my = validPairs.reduce((s, [, b]) => s + b, 0) / validPairs.length;

      let num = 0, dx = 0, dy = 0;
      for (const [a, b] of validPairs) {
        num += (a - mx) * (b - my);
        dx += (a - mx) ** 2;
        dy += (b - my) ** 2;
      }

      const denom = Math.sqrt(dx * dy);
      return denom === 0 ? 0 : num / denom;
    })
  );

  return { columns: numCols, matrix };
}

export function getDistributionData(data: Record<string, unknown>[], column: string, bins = 20): { bin: string; count: number }[] {
  const nums = data.map((row) => Number(row[column])).filter((n) => !isNaN(n));
  if (nums.length === 0) return [];

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return [{ bin: String(min), count: nums.length }];

  const binWidth = (max - min) / bins;
  const buckets = Array(bins).fill(0);

  for (const n of nums) {
    const idx = Math.min(Math.floor((n - min) / binWidth), bins - 1);
    buckets[idx]++;
  }

  return buckets.map((count, i) => ({
    bin: `${(min + i * binWidth).toFixed(1)}`,
    count,
  }));
}

export interface BoxPlotData {
  column: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

export function getBoxPlotData(data: Record<string, unknown>[], column: string): BoxPlotData | null {
  const nums = data.map((row) => Number(row[column])).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  if (nums.length === 0) return null;

  const percentile = (arr: number[], p: number) => {
    const idx = (p / 100) * (arr.length - 1);
    const lower = Math.floor(idx);
    const frac = idx - lower;
    return arr[lower] + (arr[Math.min(lower + 1, arr.length - 1)] - arr[lower]) * frac;
  };

  const q1 = percentile(nums, 25);
  const median = percentile(nums, 50);
  const q3 = percentile(nums, 75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const whiskerMin = nums.find((n) => n >= lowerFence) ?? nums[0];
  const whiskerMax = [...nums].reverse().find((n) => n <= upperFence) ?? nums[nums.length - 1];
  const outliers = nums.filter((n) => n < lowerFence || n > upperFence);

  return { column, min: whiskerMin, q1, median, q3, max: whiskerMax, outliers };
}

export function getCategoricalDistribution(data: Record<string, unknown>[], column: string): { category: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const row of data) {
    const val = String(row[column] ?? "N/A");
    counts[val] = (counts[val] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([category, count]) => ({ category, count }));
}
