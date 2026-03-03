import React, { createContext, useContext, useState, ReactNode } from "react";
import { DatasetInfo } from "@/lib/dataAnalysis";

interface DataContextType {
  dataset: DatasetInfo | null;
  fileName: string;
  setDataset: (data: DatasetInfo) => void;
  setFileName: (name: string) => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [fileName, setFileName] = useState("");

  const clearData = () => {
    setDataset(null);
    setFileName("");
  };

  return (
    <DataContext.Provider value={{ dataset, fileName, setDataset, setFileName, clearData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
