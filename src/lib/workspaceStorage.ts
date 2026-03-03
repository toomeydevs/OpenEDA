import localforage from "localforage";
import { DatasetInfo } from "./dataAnalysis";

export interface WorkspaceState {
    dataset: DatasetInfo | null;
    fileName: string | null;
    lastUpdated: number;
}

const STORE_KEY = "openeda_workspace";

localforage.config({
    name: "OpenEDA",
    storeName: "workspace",
    description: "Stores user datasets and analysis state locally"
});

export async function saveWorkspace(dataset: DatasetInfo | null, fileName: string | null): Promise<void> {
    if (!dataset) {
        await clearWorkspace();
        return;
    }

    const state: WorkspaceState = {
        dataset,
        fileName,
        lastUpdated: Date.now()
    };

    try {
        await localforage.setItem(STORE_KEY, state);
    } catch (error) {
        console.error("Failed to save workspace to IndexedDB", error);
    }
}

export async function loadWorkspace(): Promise<WorkspaceState | null> {
    try {
        const state = await localforage.getItem<WorkspaceState>(STORE_KEY);
        return state;
    } catch (error) {
        console.error("Failed to load workspace from IndexedDB", error);
        return null;
    }
}

export async function clearWorkspace(): Promise<void> {
    try {
        await localforage.removeItem(STORE_KEY);
    } catch (error) {
        console.error("Failed to clear workspace from IndexedDB", error);
    }
}
