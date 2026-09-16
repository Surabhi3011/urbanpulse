import type { AnomaliesFile, ForecastsFile, RouteMetric, Station } from "../types/data";
import type { FilterState } from "../types/filters";
import type { DailyPoint, KpiSummary } from "./aggregate";

function filterSummaryRows(filters: FilterState): [string, string][] {
  return [
    ["Date range", `${filters.startDate} to ${filters.endDate}`],
    ["Day type", filters.dayType],
    ["Hour range", `${filters.hourStart}:00 - ${filters.hourEnd}:00`],
    ["User type", filters.userType ?? "all"],
    ["Bike type", filters.bikeType ?? "all"],
    ["Station filter", filters.stationId ?? "none"],
    ["Generated at", new Date().toISOString()],
  ];
}

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Exports the currently filtered daily metrics as CSV, with the applied
 * filters recorded in a header block above the data (intent.md 13). */
export function exportDailyMetricsCsv(daily: DailyPoint[], filters: FilterState) {
  const header = filterSummaryRows(filters).map(([k, v]) => [`# ${k}:`, v]);
  const rows: (string | number)[][] = [
    ...header,
    [],
    ["Date", "Trips", "Total Duration (min)", "Avg Duration (min)"],
    ...daily.map((d) => [d.date, d.trips, d.durationSumMin.toFixed(1), (d.durationSumMin / (d.trips || 1)).toFixed(1)]),
  ];
  downloadBlob(toCsv(rows), "urbanpulse-daily-metrics.csv", "text/csv;charset=utf-8;");
}

export interface ExcelExportInput {
  filters: FilterState;
  kpis: KpiSummary;
  daily: DailyPoint[];
  stations: Station[];
  routes: RouteMetric[];
  anomalies: AnomaliesFile;
  forecasts: ForecastsFile;
}

/** Builds and downloads a multi-sheet Excel workbook reflecting the current
 * filter state (intent.md 13: Filter Summary, KPI Summary, Daily Metrics,
 * Station Metrics, Route Metrics, Anomalies, Forecast). SheetJS is
 * dynamically imported here since it's only needed for this one action. */
export async function exportExcelWorkbook(input: ExcelExportInput) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const filterSheet = XLSX.utils.aoa_to_sheet([
    ["Filter", "Value"],
    ...filterSummaryRows(input.filters),
  ]);
  XLSX.utils.book_append_sheet(wb, filterSheet, "Filter Summary");

  const kpiSheet = XLSX.utils.aoa_to_sheet([
    ["Metric", "Value"],
    ["Total Trips", input.kpis.totalTrips],
    ["Avg Daily Trips", Math.round(input.kpis.avgDailyTrips)],
    ["Avg Trip Duration (min)", input.kpis.avgDurationMin.toFixed(1)],
    ["Active Stations", input.kpis.activeStations],
    ["Peak Hour", input.kpis.peakHour ?? "n/a"],
    ["Member Share", input.kpis.memberShare !== null ? `${(input.kpis.memberShare * 100).toFixed(1)}%` : "n/a"],
    ["Top Station", input.kpis.topStation?.name ?? "n/a"],
    ["Top Route", input.kpis.topRoute?.label ?? "n/a"],
  ]);
  XLSX.utils.book_append_sheet(wb, kpiSheet, "KPI Summary");

  const dailySheet = XLSX.utils.aoa_to_sheet([
    ["Date", "Trips", "Total Duration (min)", "Avg Duration (min)"],
    ...input.daily.map((d) => [d.date, d.trips, Number(d.durationSumMin.toFixed(1)), Number((d.durationSumMin / (d.trips || 1)).toFixed(1))]),
  ]);
  XLSX.utils.book_append_sheet(wb, dailySheet, "Daily Metrics");

  const stationSheet = XLSX.utils.aoa_to_sheet([
    ["Station ID", "Name", "Lat", "Lng", "Starts", "Ends", "Total Activity", "Net Flow", "Avg Duration (min)", "Member Share"],
    ...input.stations.map((s) => [
      s.station_id,
      s.name,
      s.lat,
      s.lng,
      s.starts_count,
      s.ends_count,
      s.total_activity,
      s.net_flow,
      s.avg_start_duration_min,
      s.member_share_starts,
    ]),
  ]);
  XLSX.utils.book_append_sheet(wb, stationSheet, "Station Metrics");

  const routeSheet = XLSX.utils.aoa_to_sheet([
    ["Start Station", "End Station", "Trips", "Avg Duration (min)", "Member Share"],
    ...input.routes.map((r) => [r.start_station_name, r.end_station_name, r.trips, r.avg_duration_min, r.member_share]),
  ]);
  XLSX.utils.book_append_sheet(wb, routeSheet, "Route Metrics");

  const anomalySheet = XLSX.utils.aoa_to_sheet([
    ["Date", "Trips", "Weekday Baseline", "Modified Z", "Is Anomaly", "Direction"],
    ...input.anomalies.days.map((d) => [d.date, d.trips, d.weekday_median, d.modified_z, d.is_anomaly, d.direction]),
  ]);
  XLSX.utils.book_append_sheet(wb, anomalySheet, "Anomalies");

  const forecastSheet = XLSX.utils.aoa_to_sheet([
    ["Date", "Actual Trips", "Forecast Trips"],
    ...input.forecasts.historical.map((h) => [h.date, h.trips, ""]),
    ...input.forecasts.forecast.map((f) => [f.date, "", f.forecast_trips]),
  ]);
  XLSX.utils.book_append_sheet(wb, forecastSheet, "Forecast");

  XLSX.writeFile(wb, "urbanpulse-export.xlsx");
}
