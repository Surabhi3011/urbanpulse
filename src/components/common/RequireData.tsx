import type { ReactNode } from "react";
import { useDataState } from "../../context/DataContext";
import { useFilterStore } from "../../context/filterStore";
import { FilterInitializer } from "../filters/FilterInitializer";
import { ErrorState } from "./ErrorState";
import { PageSkeleton } from "./Skeleton";

export function RequireData({ children }: { children: ReactNode }) {
  const state = useDataState();
  const startDate = useFilterStore((s) => s.startDate);

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error") {
    return (
      <ErrorState
        message={`${state.message} Make sure the app was built with the data pipeline output in public/data.`}
        onRetry={() => window.location.reload()}
      />
    );
  }
  // FilterInitializer seeds the date-range defaults in an effect that runs
  // after this first renders with data ready. It must stay mounted even
  // while we wait, otherwise its effect never fires and startDate never
  // gets set. Only the actual page content waits for that to complete, so
  // pages never aggregate against an empty date range.
  return (
    <>
      <FilterInitializer />
      {startDate ? children : <PageSkeleton />}
    </>
  );
}
