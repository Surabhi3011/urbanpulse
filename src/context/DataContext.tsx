import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadUrbanPulseData } from "../services/dataLoader";
import type { UrbanPulseData } from "../types/data";

type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: UrbanPulseData };

const DataContext = createContext<DataState>({ status: "loading" });

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadUrbanPulseData()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Failed to load dashboard data.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useDataState(): DataState {
  return useContext(DataContext);
}

/** Convenience hook for components that only render once data is ready
 * (call this inside a subtree gated by <RequireData>). */
export function useUrbanPulseData(): UrbanPulseData {
  const state = useDataState();
  if (state.status !== "ready") {
    throw new Error("useUrbanPulseData() called before data was ready");
  }
  return state.data;
}
