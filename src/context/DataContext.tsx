import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { DatasetInfo } from "@/lib/dataAnalysis";
import { saveWorkspace, loadWorkspace, clearWorkspace as clearStorage } from "@/lib/workspaceStorage";

interface DataContextType {
  dataset: DatasetInfo | null;
  fileName: string;
  setDataset: (data: DatasetInfo) => void;
  setFileName: (name: string) => void;
  clearData: () => void;
  isRestoring: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [fileName, setFileName] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);

  // Load from IndexedDB on mount
  useEffect(() => {
    async function restore() {
      const state = await loadWorkspace();
      if (state && state.dataset) {
        setDataset(state.dataset);
        setFileName(state.fileName || "");
      }
      setIsRestoring(false);
    }
    restore();
  }, []);

  // Save to IndexedDB when data changes (only after initial restore is done)
  useEffect(() => {
    if (!isRestoring) {
      saveWorkspace(dataset, fileName);
    }
  }, [dataset, fileName, isRestoring]);

  const clearData = () => {
    setDataset(null);
    setFileName("");
    clearStorage();
  };

  return (
    <DataContext.Provider value={{ dataset, fileName, setDataset, setFileName, clearData, isRestoring }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
