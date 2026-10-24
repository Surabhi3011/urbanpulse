import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { useUrbanPulseData } from "../../context/DataContext";
import { useFilterStore } from "../../context/filterStore";
import { computeKpis, dailyTotals, filterTemporalCube } from "../../services/aggregate";
import { exportDailyMetricsCsv, exportExcelWorkbook } from "../../services/exportService";

/** CSV/Excel/print export controls. Every export reflects the current
 * global filter state. Printing uses the print stylesheet
 * (index.css) rather than a client-side PDF library. */
export function ExportMenu() {
  const { temporalCube, stations, routes, anomalies, forecasts } = useUrbanPulseData();
  const filters = useFilterStore();

  const handleCsv = () => {
    const filtered = filterTemporalCube(temporalCube, filters);
    exportDailyMetricsCsv(dailyTotals(filtered), filters);
  };

  const handleExcel = async () => {
    const filtered = filterTemporalCube(temporalCube, filters);
    const daily = dailyTotals(filtered);
    const kpis = computeKpis(filtered, stations, routes);
    await exportExcelWorkbook({ filters, kpis, daily, stations, routes, anomalies, forecasts });
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={handleCsv} className={btnClass}>
        <FileText aria-hidden="true" size={14} />
        Export CSV
      </button>
      <button type="button" onClick={handleExcel} className={btnClass}>
        <FileSpreadsheet aria-hidden="true" size={14} />
        Export Excel
      </button>
      <button type="button" onClick={() => window.print()} className={btnClass}>
        <Printer aria-hidden="true" size={14} />
        Print / Save PDF
      </button>
    </div>
  );
}

const btnClass =
  "flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]";
