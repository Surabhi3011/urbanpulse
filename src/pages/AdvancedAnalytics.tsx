import { useMemo } from "react";
import { ChartCard } from "../components/charts/ChartCard";
import { IconLegend } from "../components/charts/IconLegend";
import { FilterBar } from "../components/filters/FilterBar";
import { useUrbanPulseData } from "../context/DataContext";
import { useFilterStore } from "../context/filterStore";
import { dailyTotals, filterTemporalCube } from "../services/aggregate";
import { USER_TYPE_META } from "../utils/categoryIcons";
import { formatInt, formatMinutes } from "../utils/format";
import { histogram, pearsonCorrelation } from "../utils/stats";

export default function AdvancedAnalytics() {
  const { temporalCube, stations, anomalies, forecasts, durationHistogram } = useUrbanPulseData();
  const filters = useFilterStore();

  const filtered = useMemo(() => filterTemporalCube(temporalCube, filters), [temporalCube, filters]);
  const daily = useMemo(() => dailyTotals(filtered), [filtered]);

  const scatterData = useMemo(
    () =>
      daily
        .filter((d) => d.trips > 0)
        .map((d) => [d.trips, d.durationSumMin / d.trips, d.date] as [number, number, string]),
    [daily]
  );
  const correlation = useMemo(
    () => pearsonCorrelation(scatterData.map((d) => d[0]), scatterData.map((d) => d[1])),
    [scatterData]
  );

  const stationDemandHist = useMemo(
    () => histogram(stations.map((s) => s.total_activity), 14),
    [stations]
  );
  const dailyTripsHist = useMemo(() => histogram(daily.map((d) => d.trips), 14), [daily]);

  const durationBins = durationHistogram.bin_order;
  const durationByBin = useMemo(() => {
    const map = new Map<string, { member: number; casual: number }>();
    for (const bin of durationBins) map.set(bin, { member: 0, casual: 0 });
    for (const row of durationHistogram.counts) {
      const entry = map.get(row.bin);
      if (!entry) continue;
      if (row.member_casual === "member") entry.member += row.trips;
      else entry.casual += row.trips;
    }
    return durationBins.map((bin) => ({ bin, ...map.get(bin)! }));
  }, [durationHistogram, durationBins]);

  const anomalyDays = anomalies.days;
  const flaggedAnomalies = useMemo(() => anomalyDays.filter((d) => d.is_anomaly), [anomalyDays]);

  const forecastDates = [
    ...forecasts.historical.map((h) => h.date),
    ...forecasts.forecast.map((f) => f.date),
  ];
  const actualSeries = [
    ...forecasts.historical.map((h) => h.trips),
    ...forecasts.forecast.map(() => null),
  ];
  const forecastSeries = [
    ...forecasts.historical.map(() => null),
    ...forecasts.forecast.map((f) => f.forecast_trips),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Advanced Analytics</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Correlation, distribution, anomaly, and forecast views. Anomaly and forecast panels use
          the full dataset's daily series regardless of the filters below, since they're
          system-level statistical methods; the correlation and distribution panels respect the
          active filters.
        </p>
      </div>

      <FilterBar />

      <ChartCard
        title="Correlation: Daily Trip Volume vs. Avg Trip Duration"
        subtitle={`Each point is one day in the selected range. Pearson r = ${correlation !== null ? correlation.toFixed(2) : "—"}. This shows association only, not causation.`}
        isEmpty={scatterData.length === 0}
        option={{
          grid: { left: 56, right: 16, top: 16, bottom: 40 },
          xAxis: { type: "value", name: "Trips" },
          yAxis: { type: "value", name: "Avg duration (min)" },
          tooltip: {
            formatter: (p: any) =>
              `${p.value[2]}<br/>Trips: ${formatInt(p.value[0])}<br/>Avg duration: ${p.value[1].toFixed(1)} min`,
          },
          series: [
            {
              type: "scatter",
              data: scatterData,
              symbolSize: 7,
              itemStyle: { color: "#2563eb", opacity: 0.6 },
            },
          ],
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard
          title="Station Demand Distribution"
          subtitle="Whole-period total activity across all stations"
          isEmpty={stationDemandHist.length === 0}
          option={{
            grid: { left: 48, right: 16, top: 16, bottom: 48 },
            xAxis: { type: "category", data: stationDemandHist.map((b) => b.label), axisLabel: { rotate: 45 } },
            yAxis: { type: "value", name: "Stations" },
            tooltip: { trigger: "axis" },
            series: [{ type: "bar", data: stationDemandHist.map((b) => b.count), itemStyle: { color: "#2563eb" } }],
          }}
        />
        <ChartCard
          title="Daily Trips Distribution"
          subtitle="Selected date range"
          isEmpty={dailyTripsHist.length === 0}
          option={{
            grid: { left: 48, right: 16, top: 16, bottom: 48 },
            xAxis: { type: "category", data: dailyTripsHist.map((b) => b.label), axisLabel: { rotate: 45 } },
            yAxis: { type: "value", name: "Days" },
            tooltip: { trigger: "axis" },
            series: [{ type: "bar", data: dailyTripsHist.map((b) => b.count), itemStyle: { color: "#2563eb" } }],
          }}
        />
      </div>

      <ChartCard
        title="Trip Duration Distribution"
        subtitle="By user type, whole dataset (not affected by filters above -- see note)"
        isEmpty={durationByBin.every((b) => b.member + b.casual === 0)}
        option={{
          grid: { left: 48, right: 16, top: 16, bottom: 32 },
          xAxis: { type: "category", data: durationByBin.map((b) => `${b.bin} min`) },
          yAxis: { type: "value", name: "Trips" },
          tooltip: { trigger: "axis", valueFormatter: (v) => formatInt(Number(v)) },
          legend: { show: false },
          series: [
            { name: USER_TYPE_META.member.label, type: "bar", stack: "u", data: durationByBin.map((b) => b.member), itemStyle: { color: USER_TYPE_META.member.color } },
            { name: USER_TYPE_META.casual.label, type: "bar", stack: "u", data: durationByBin.map((b) => b.casual), itemStyle: { color: USER_TYPE_META.casual.color } },
          ],
        }}
      />
      <IconLegend items={[USER_TYPE_META.member, USER_TYPE_META.casual]} />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Object.entries(durationHistogram.percentiles_min).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 text-center">
            <p className="text-xs uppercase text-[var(--color-text-muted)]">{k}</p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatMinutes(v)}</p>
          </div>
        ))}
      </div>

      <ChartCard
        title="Anomaly Detection"
        subtitle={anomalies.method === "modified_z_score_local_weekday_baseline"
          ? `Modified z-score vs. a local same-weekday baseline (±${anomalies.baseline_window_days} days). |z| > ${anomalies.threshold} flagged. Statistical outliers only -- not confirmed real-world events.`
          : anomalies.method}
        height={340}
        isEmpty={anomalyDays.length === 0}
        option={{
          grid: { left: 56, right: 16, top: 16, bottom: 32 },
          xAxis: { type: "category", data: anomalyDays.map((d) => d.date) },
          yAxis: { type: "value", name: "Trips" },
          tooltip: {
            trigger: "axis",
            formatter: (p: any) => {
              const d = anomalyDays[p[0].dataIndex];
              return `${d.date}<br/>Trips: ${formatInt(d.trips)}<br/>Baseline: ${formatInt(d.weekday_median)}<br/>z: ${d.modified_z}${d.is_anomaly ? ` (${d.direction})` : ""}`;
            },
          },
          series: [
            {
              type: "line",
              data: anomalyDays.map((d) => d.trips),
              symbol: "circle",
              symbolSize: (_: unknown, params: any) => (anomalyDays[params.dataIndex].is_anomaly ? 9 : 0),
              itemStyle: {
                color: (params: any) =>
                  anomalyDays[params.dataIndex].direction === "spike" ? "#dc2626" : "#d97706",
              },
              lineStyle: { color: "#94a3b8", width: 1.5 },
              showSymbol: true,
            },
          ],
        }}
      />
      {flaggedAnomalies.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
            Flagged Days ({flaggedAnomalies.length})
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {flaggedAnomalies.map((d) => (
              <div key={d.date} className="flex items-center justify-between rounded-md bg-[var(--color-surface-subtle)] px-3 py-2">
                <span className="text-[var(--color-text-secondary)]">{d.date}</span>
                <span className={`font-medium ${d.direction === "spike" ? "text-[var(--color-negative)]" : "text-[var(--color-warning)]"}`}>
                  {d.direction} (z={d.modified_z})
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <ChartCard
        title="Demand Forecast"
        subtitle={`${forecasts.method.replaceAll("_", " ")} — trailing ${forecasts.trailing_window_days}d window, ${forecasts.horizon_days}d horizon. A simple statistical baseline, not a precise prediction.`}
        isEmpty={forecastDates.length === 0}
        option={{
          grid: { left: 56, right: 16, top: 16, bottom: 32 },
          xAxis: { type: "category", data: forecastDates },
          yAxis: { type: "value", name: "Trips" },
          tooltip: { trigger: "axis" },
          legend: { top: 0 },
          series: [
            {
              name: "Actual",
              type: "line",
              data: actualSeries,
              connectNulls: false,
              itemStyle: { color: "#2563eb" },
              lineStyle: { color: "#2563eb" },
              symbol: "none",
            },
            {
              name: "Forecast",
              type: "line",
              data: forecastSeries,
              connectNulls: false,
              itemStyle: { color: "#f97316" },
              lineStyle: { color: "#f97316", type: "dashed" },
              symbol: "none",
            },
          ],
        }}
      />
    </div>
  );
}
