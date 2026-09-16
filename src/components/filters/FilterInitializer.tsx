import { useEffect } from "react";
import { useFilterStore } from "../../context/filterStore";
import { useUrbanPulseData } from "../../context/DataContext";

/** Seeds the global filter store with the dataset's actual date range the
 * first time data becomes available, so date-range filters have sensible
 * defaults instead of empty strings. Renders nothing. */
export function FilterInitializer() {
  const { meta } = useUrbanPulseData();
  const startDate = useFilterStore((s) => s.startDate);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  useEffect(() => {
    if (!startDate) {
      resetFilters({
        startDate: meta.dataset.date_range.start,
        endDate: meta.dataset.date_range.end,
      });
    }
  }, [startDate, meta, resetFilters]);

  return null;
}
