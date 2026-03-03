import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Hash, Type, Calendar, AlertCircle, ArrowRight, Search, Filter, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import DataPreviewTable from "@/components/DataPreviewTable";
import { generateDatasetInsights } from "@/lib/aiService";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const typeIcon = {
  numerical: Hash,
  categorical: Type,
  date: Calendar,
  unknown: AlertCircle,
};

const typeColor: Record<string, string> = {
  numerical: "bg-primary/10 text-primary border-primary/20",
  categorical: "bg-accent/10 text-accent border-accent/20",
  date: "bg-warning/10 text-warning border-warning/20",
  unknown: "bg-muted text-muted-foreground border-border",
};

export default function DataOverviewPage() {
  const { dataset } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    if (!dataset) return;
    setIsGeneratingInsights(true);
    try {
      const generatedInsights = await generateDatasetInsights(dataset);
      setInsights(generatedInsights);
      toast.success("Insights generated successfully!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to generate insights.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const counts = useMemo(() => {
    if (!dataset) return { numerical: 0, categorical: 0, date: 0 };
    return {
      numerical: dataset.columnInfos.filter((c) => c.type === "numerical").length,
      categorical: dataset.columnInfos.filter((c) => c.type === "categorical").length,
      date: dataset.columnInfos.filter((c) => c.type === "date").length,
    };
  }, [dataset]);

  const filteredColumns = useMemo(() => {
    if (!dataset) return [];
    return dataset.columnInfos.filter((col) => {
      const matchesSearch = col.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || col.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [dataset, search, typeFilter]);

  if (!dataset) {
    navigate("/");
    return null;
  }

  const columnNames = dataset.columnInfos.map((c) => c.name);

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Data Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Auto-detected column types and dataset summary.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        {[
          { label: "Rows", value: dataset.rows.toLocaleString() },
          { label: "Numerical", value: counts.numerical },
          { label: "Categorical", value: counts.categorical },
          { label: "Date", value: counts.date },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-card shadow-card border border-border p-3 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{item.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </motion.div>

      {/* AI Insights Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-xl bg-card shadow-card border border-border p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Automated AI Insights
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Get instant hypotheses and statistical findings based on your dataset metadata.</p>
          </div>
          <Button
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights}
            variant={insights ? "outline" : "default"}
            className="shrink-0 gap-2"
          >
            {isGeneratingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGeneratingInsights ? "Analyzing..." : insights ? "Regenerate Insights" : "Generate Insights"}
          </Button>
        </div>

        {insights && (
          <div className="mt-6 p-5 rounded-lg bg-primary/5 border border-primary/10 text-sm prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:marker:text-primary">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        )}
      </motion.div>

      {/* Data Preview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-lg font-semibold text-foreground mb-3">Data Preview</h2>
        <DataPreviewTable data={dataset.data} columns={columnNames} />
      </motion.div>

      {/* Column Filtering & Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card text-sm h-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card h-9 text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="numerical">Numerical</SelectItem>
              <SelectItem value="categorical">Categorical</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl bg-card shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 sm:px-5 py-2 sm:py-3 font-semibold text-foreground text-xs sm:text-sm">Column</th>
                  <th className="text-left px-3 sm:px-5 py-2 sm:py-3 font-semibold text-foreground text-xs sm:text-sm">Type</th>
                  <th className="text-right px-3 sm:px-5 py-2 sm:py-3 font-semibold text-foreground text-xs sm:text-sm">Non-Null</th>
                  <th className="text-right px-3 sm:px-5 py-2 sm:py-3 font-semibold text-foreground text-xs sm:text-sm">Missing</th>
                  <th className="text-right px-3 sm:px-5 py-2 sm:py-3 font-semibold text-foreground text-xs sm:text-sm">Unique</th>
                </tr>
              </thead>
              <tbody>
                {filteredColumns.map((col) => {
                  const Icon = typeIcon[col.type];
                  return (
                    <tr key={col.name} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 sm:px-5 py-2 sm:py-3 font-mono text-xs text-foreground">{col.name}</td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3">
                        <Badge variant="outline" className={`gap-1 ${typeColor[col.type]}`}>
                          <Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{col.type}</span>
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 text-right text-foreground text-xs sm:text-sm">{col.nonNullCount.toLocaleString()}</td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 text-right">
                        <span className={col.nullCount > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {col.nullCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 text-right text-muted-foreground text-xs sm:text-sm">{col.uniqueCount.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {filteredColumns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">
                      No columns match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-end">
        <Button onClick={() => navigate("/visualize")} className="gap-2">
          Explore Visualizations <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
