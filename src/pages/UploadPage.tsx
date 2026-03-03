import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, ArrowRight, Link as LinkIcon, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseFile, fetchDataFromUrl } from "@/lib/fileParser";
import { analyzeDataset } from "@/lib/dataAnalysis";
import { useData } from "@/context/DataContext";
import { toast } from "sonner";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const { setDataset, setFileName, dataset, isRestoring } = useData();
  const navigate = useNavigate();

  // If we just restored a session, jump straight to overview unless they explicitly came back here
  // Actually, better to just let them click 'Continue' or use the layout nav.

  const handleDataLoad = useCallback(
    (data: Record<string, unknown>[], filename: string) => {
      setProgress(60);
      try {
        const info = analyzeDataset(data);
        setProgress(90);

        setDataset(info);
        setFileName(filename);
        setProgress(100);

        toast.success(`Loaded ${info.rows.toLocaleString()} rows and ${info.columns} columns.`);

        setTimeout(() => navigate("/overview"), 500);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to analyze data.");
        setIsLoading(false);
      }
    },
    [setDataset, setFileName, navigate]
  );

  const processUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      toast.error("Please enter a valid URL.");
      return;
    }

    setIsLoading(true);
    setProgress(20);

    try {
      const { data, filename } = await fetchDataFromUrl(urlInput.trim());
      handleDataLoad(data, filename);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch data from URL.");
      setIsLoading(false);
      setProgress(0);
    }
  };

  const processFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        toast.error("Please upload a CSV or Excel file.");
        return;
      }

      setIsLoading(true);
      setProgress(20);

      try {
        const data = await parseFile(file);
        handleDataLoad(data, file.name);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to parse file.");
        setIsLoading(false);
      }
    },
    [handleDataLoad]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      {isRestoring ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Restoring your workspace...</p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl"
          >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Explore your data <span className="text-primary">instantly</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload a CSV or Excel file and get auto-generated insights, statistics, and visualizations in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full max-w-xl"
          >
            <Tabs defaultValue="local" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-secondary">
                <TabsTrigger value="local">Local File</TabsTrigger>
                <TabsTrigger value="url">From URL</TabsTrigger>
              </TabsList>

              <TabsContent value="local">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-200 ${isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-card"
                    }`}
                >
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={onFileSelect}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    {isLoading ? (
                      <FileSpreadsheet className="h-7 w-7 text-primary animate-pulse" />
                    ) : (
                      <Upload className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <p className="text-base font-medium text-foreground mb-1">
                    {isLoading ? "Processing..." : "Drop your file here, or click to browse"}
                  </p>
                  <p className="text-sm text-muted-foreground">Supports CSV, XLSX, XLS</p>

                  {isLoading && (
                    <div className="w-full mt-6">
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </label>
              </TabsContent>

              <TabsContent value="url">
                <form onSubmit={processUrl} className="flex flex-col items-center justify-center rounded-2xl border-2 border-border p-8 sm:p-12 transition-all duration-200 bg-card">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-6">
                    {isLoading ? (
                      <Download className="h-7 w-7 text-primary animate-pulse" />
                    ) : (
                      <LinkIcon className="h-7 w-7 text-primary" />
                    )}
                  </div>

                  <div className="w-full max-w-md space-y-4">
                    <div className="space-y-2 text-center">
                      <h3 className="font-medium text-foreground">Import from Public API</h3>
                      <p className="text-sm text-muted-foreground">Enter a URL to a public JSON array or CSV file.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="url"
                        placeholder="https://api.example.com/data.json"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 bg-background"
                        required
                      />
                      <Button type="submit" disabled={isLoading} className="shrink-0 gap-2">
                        {isLoading ? "Fetching..." : "Fetch Data"} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {isLoading && (
                      <div className="w-full mt-4">
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </motion.div>

          {dataset && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <Button onClick={() => navigate("/overview")} className="gap-2">
                Continue to Overview <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-4"
          >
            {[
              { title: "Auto-detect types", desc: "Numerical, categorical, and date columns detected automatically" },
              { title: "Rich statistics", desc: "Mean, median, standard deviation, quartiles, and more" },
              { title: "Export as PDF", desc: "Generate a comprehensive report you can share" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-card shadow-card p-5 border border-border">
                <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
