import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/DataContext";
import {
  computeSummaryStats,
  computeMissingValues,
  computeCorrelation,
} from "@/lib/dataAnalysis";
import { hexToRgb } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportPage() {
  const { dataset, fileName } = useData();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState("OpenEDA Report");
  const [author, setAuthor] = useState("");
  const [themeColor, setThemeColor] = useState("#2962A8");

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

  if (!dataset) {
    navigate("/");
    return null;
  }

  const missingWithData = missingValues.filter((m) => m.missing > 0);

  const fmt = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(2));

  const generatePDF = () => {
    setIsGenerating(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const rgb = hexToRgb(themeColor);

        doc.setFontSize(22);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text(reportTitle, 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`File: ${fileName}`, 14, 33);
        if (author.trim()) {
          doc.text(`Author: ${author.trim()}`, 14, 39);
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 45);
          doc.text(`${dataset.rows.toLocaleString()} rows × ${dataset.columns} columns`, 14, 51);
        } else {
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 39);
          doc.text(`${dataset.rows.toLocaleString()} rows × ${dataset.columns} columns`, 14, 45);
        }

        const overviewStartY = author.trim() ? 64 : 58;
        doc.setFontSize(14);
        doc.setTextColor(30);
        doc.text("Column Overview", 14, overviewStartY);

        autoTable(doc, {
          startY: overviewStartY + 4,
          head: [["Column", "Type", "Non-Null", "Missing", "Unique"]],
          body: dataset.columnInfos.map((c) => [
            c.name, c.type, c.nonNullCount.toString(), c.nullCount.toString(), c.uniqueCount.toString(),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: rgb },
        });

        if (summaryStats.length > 0) {
          const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
          const finalY = lastTable?.finalY ?? 100;
          if (finalY > 240) doc.addPage();
          doc.setFontSize(14);
          doc.setTextColor(30);
          doc.text("Summary Statistics", 14, finalY > 240 ? 20 : finalY + 15);
          autoTable(doc, {
            startY: finalY > 240 ? 24 : finalY + 19,
            head: [["Column", "Count", "Mean", "Std", "Min", "25%", "50%", "75%", "Max"]],
            body: summaryStats.map((s) => [
              s.column, fmt(s.count), fmt(s.mean), fmt(s.std), fmt(s.min), fmt(s.q25), fmt(s.median), fmt(s.q75), fmt(s.max),
            ]),
            styles: { fontSize: 7 },
            headStyles: { fillColor: rgb },
          });
        }

        if (missingWithData.length > 0) {
          doc.addPage();
          doc.setFontSize(14);
          doc.text("Missing Values", 14, 20);
          autoTable(doc, {
            startY: 24,
            head: [["Column", "Missing", "Total", "Percentage"]],
            body: missingWithData.map((m) => [
              m.column, m.missing.toString(), m.total.toString(), `${m.percentage.toFixed(1)}%`,
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [220, 80, 80] },
          });
        }

        if (correlation.columns.length >= 2) {
          doc.addPage();
          doc.setFontSize(14);
          doc.text("Correlation Matrix", 14, 20);
          autoTable(doc, {
            startY: 24,
            head: [["", ...correlation.columns]],
            body: correlation.matrix.map((row, i) => [
              correlation.columns[i], ...row.map((v) => v.toFixed(2)),
            ]),
            styles: { fontSize: 6 },
            headStyles: { fillColor: rgb },
          });
        }

        doc.save(`openeda-report-${fileName.replace(/\.[^.]+$/, "")}.pdf`);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Export Report</h1>
        <p className="text-muted-foreground">Generate a PDF summarizing your data analysis.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-card shadow-card border border-border p-8"
      >
        <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero">
            <FileText className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your Report is Ready</h2>
            <p className="text-sm text-muted-foreground">
              The PDF will include column overview, summary statistics
              {missingWithData.length > 0 ? ", missing value analysis" : ""}
              {correlation.columns.length >= 2 ? ", and correlation matrix" : ""}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm w-full">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground">Columns analyzed</p>
              <p className="text-lg font-semibold text-foreground">{dataset.columns}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground">Data points</p>
              <p className="text-lg font-semibold text-foreground">{(dataset.rows * dataset.columns).toLocaleString()}</p>
            </div>
          </div>

          <div className="w-full space-y-4 text-left">
            <h3 className="text-sm font-semibold text-foreground">Report Branding</h3>
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="OpenEDA Report"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-author">Author</Label>
              <Input
                id="report-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme-color">Theme Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="theme-color"
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                />
                <span className="text-sm text-muted-foreground font-mono">{themeColor.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <Button onClick={generatePDF} disabled={isGenerating} size="lg" className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download PDF Report
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
