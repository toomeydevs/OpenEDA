import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
  pageSize?: number;
}

export default function DataPreviewTable({ data, columns, pageSize = 10 }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = useMemo(
    () => data.slice(page * pageSize, (page + 1) * pageSize),
    [data, page, pageSize]
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl bg-card shadow-card border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left font-semibold text-foreground text-xs w-12">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-semibold text-foreground text-xs whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 text-xs text-muted-foreground">{page * pageSize + i + 1}</td>
                {columns.map((col) => {
                  const val = row[col];
                  const display = val === null || val === undefined || val === "" ? "—" : String(val);
                  const isMissing = val === null || val === undefined || val === "";
                  return (
                    <td
                      key={col}
                      className={`px-3 py-2 text-xs whitespace-nowrap max-w-[200px] truncate ${
                        isMissing ? "text-muted-foreground italic" : "text-foreground"
                      }`}
                      title={display}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length.toLocaleString()} rows
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
