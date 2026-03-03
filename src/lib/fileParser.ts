import Papa from "papaparse";
import * as XLSX from "xlsx";

export function parseCSV(file: File | string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => resolve(result.data as Record<string, unknown>[]),
      error: (err) => reject(err),
    });
  });
}

export function parseExcel(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCSV(file);
  if (ext === "xlsx" || ext === "xls") return parseExcel(file);
  throw new Error("Unsupported file format. Please upload a CSV or Excel file.");
}

export async function fetchDataFromUrl(url: string): Promise<{ data: Record<string, unknown>[]; filename: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    const filename = url.split("/").pop() || "fetched_data";

    if (contentType?.includes("application/json") || url.endsWith(".json")) {
      const json = await response.json();
      if (Array.isArray(json)) {
        return { data: json, filename: filename.endsWith(".json") ? filename : `${filename}.json` };
      } else if (typeof json === "object" && json !== null) {
        // Try to find an array inside the object
        const arrayValues = Object.values(json).find(Array.isArray);
        if (arrayValues) return { data: arrayValues, filename: `${filename}.json` };

        throw new Error("The fetched JSON does not contain an array of objects.");
      }
      throw new Error("Expected a JSON array of objects.");
    } else {
      // Assume CSV or text
      const text = await response.text();
      const data = await parseCSV(text);
      return { data, filename: filename.endsWith(".csv") ? filename : `${filename}.csv` };
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error or CORS issue. Make sure the URL is public and allows Cross-Origin requests.");
    }
    throw error;
  }
}
