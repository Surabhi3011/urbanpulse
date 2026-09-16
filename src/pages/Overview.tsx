import { Bike, Clock, MapPin, Route, Star, TrendingUp, UserCheck, Zap } from "lucide-react";
import { useMemo } from "react";
import { ChartCard } from "../components/charts/ChartCard";
import { ExportMenu } from "../components/exports/ExportMenu";
import { FilterBar } from "../components/filters/FilterBar";
import { IconLegend } from "../components/charts/IconLegend";
import { KpiCard } from "../components/kpis/KpiCard";
import { useUrbanPulseData } from "../context/DataContext";
import { useFilterStore } from "../context/filterStore";
import {
  compareCurrentVsPreviousPeriod,
  computeKpis,
  dailyTotals,
  filterTemporalCube,
  hourlyProfile,
  userTypeSplit,
} from "../services/aggregate";
import { USER_TYPE_META } from "../utils/categoryIcons";
import { formatCompact, formatHour, formatInt, formatMinutes, formatPct } from "../utils/format";

export default function Overview() {
  const { temporalCube, stations, routes } = useUrbanPulseData();
  const filters = useFilterStore();

  const filtered = useMemo(() => filterTemporalCube(temporalCube, filters), [temporalCube, filters]);
  const kpis = useMemo(() => computeKpis(filtered, stations, routes), [filtered, stations, routes]);
  const daily = useMemo(() => dailyTotals(filtered), [filtered]);
  const hourly = useMemo(() => hourlyProfile(filtered), [filtered]);
  const userSplit = useMemo(() => userTypeSplit(filtered), [filtered]);
  const comparison = useMemo(
    () => compareCurrentVsPreviousPeriod(temporalCube, filters),
    [temporalCube, filters]
  );
  const topStations = useMemo(
    () => [...stations].sort((a, b) => b.total_activity - a.total_activity).slice(0, 8),
    [stations]
  );
  const topRoutes = useMemo(() => routes.slice(0, 5), [routes]);

  const insights = useMemo(() => {
    const list: string[] = [];
    if (kpis.peakHour !== null) {
      list.push(`Peak demand occurs around ${formatHour(kpis.peakHour)}, consistent with commute patterns.`);
    }
    if (kpis.memberShare !== null) {
      list.push(
        `Members account for ${formatPct(kpis.memberShare)} of trips in the selected range.`
      );
    }
    if (comparison.pctDiff !== null) {
      const dir = comparison.pctDiff >= 0 ? "up" : "down";
      list.push(
        `Total trips are ${dir} ${Math.abs(comparison.pctDiff).toFixed(1)}% versus the immediately preceding period of equal length.`
      );
    }
    if (kpis.topStation) {
      list.push(`${kpis.topStation.name} is the busiest station in the selected range.`);
    }
    return list;
  }, [kpis, comparison]);

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-black">UrbanPulse — Urban Mobility Report</h1>
        <p className="text-sm text-black">Generated {new Date().toLocaleString()}</p>
        <p className="text-sm text-black">
          Filters: {filters.startDate} to {filters.endDate} · {filters.dayType} ·{" "}
          {filters.hourStart}:00–{filters.hourEnd}:00 · user type: {filters.userType ?? "all"} ·
          bike type: {filters.bikeType ?? "all"}
        </p>
        <p className="mt-1 text-xs text-black">
          Source: NYC Citi Bike System Data. See Methodology &amp; Data Sources for cleaning steps,
          metric definitions, and limitations.
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Overview</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            System-wide snapshot of NYC Citi Bike demand for the selected filters.
          </p>
        </div>
        <ExportMenu />
      </div>

      <FilterBar />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Bike}
          label="Total Trips"
          value={formatCompact(kpis.totalTrips)}
          sublabel="vs. previous period"
          comparison={{ pctDiff: comparison.pctDiff }}
        />
        <KpiCard icon={TrendingUp} label="Avg Daily Trips" value={formatCompact(kpis.avgDailyTrips)} />
        <KpiCard icon={Clock} label="Avg Trip Duration" value={formatMinutes(kpis.avgDurationMin)} />
        <KpiCard icon={MapPin} label="Active Stations" value={formatInt(kpis.activeStations)} />
        <KpiCard
          icon={Zap}
          label="Peak Hour"
          value={kpis.peakHour !== null ? formatHour(kpis.peakHour) : "—"}
        />
        <KpiCard
          icon={Star}
          label="Top Station"
          value={kpis.topStation ? formatCompact(kpis.topStation.trips) : "—"}
          sublabel={kpis.topStation?.name}
        />
        <KpiCard
          icon={UserCheck}
          label="Member Share"
          value={kpis.memberShare !== null ? formatPct(kpis.memberShare) : "—"}
        />
        <KpiCard
          icon={Route}
          label="Top Route"
          value={kpis.topRoute ? formatCompact(kpis.topRoute.trips) : "—"}
          sublabel={kpis.topRoute?.label}
        />
      </div>

      <ChartCard
        title="Demand Trend"
        subtitle="Daily trips over the selected date range"
        isEmpty={daily.length === 0}
        ariaSummary={`Line chart of daily trips from ${filters.startDate} to ${filters.endDate}`}
        option={{
          grid: { left: 48, right: 16, top: 16, bottom: 32 },
          xAxis: { type: "category", data: daily.map((d) => d.date), boundaryGap: false },
          yAxis: { type: "value", name: "Trips" },
          tooltip: { trigger: "axis", valueFormatter: (v) => formatInt(Number(v)) },
          series: [
            {
              type: "line",
              data: daily.map((d) => d.trips),
              smooth: true,
              symbol: "none",
              areaStyle: { opacity: 0.08 },
              itemStyle: { color: "#2563eb" },
              lineStyle: { color: "#2563eb" },
            },
          ],
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard
          title="Peak Usage by Hour"
          subtitle="Total trips by hour of day"
          isEmpty={hourly.every((h) => h.trips === 0)}
          ariaSummary="Bar chart of trips by hour of day"
          option={{
            grid: { left: 48, right: 16, top: 16, bottom: 32 },
            xAxis: { type: "category", data: hourly.map((h) => formatHour(h.hour)) },
            yAxis: { type: "value", name: "Trips" },
            tooltip: { trigger: "axis", valueFormatter: (v) => formatInt(Number(v)) },
            series: [{ type: "bar", data: hourly.map((h) => h.trips), itemStyle: { color: "#2563eb" } }],
          }}
        />
        <div className="flex flex-col">
          <ChartCard
            title="User-Type Distribution"
            subtitle="Member vs. casual share of trips"
            isEmpty={userSplit.length === 0}
            ariaSummary="Donut chart of member vs casual trip share"
            option={{
              tooltip: { trigger: "item", valueFormatter: (v) => formatInt(Number(v)) },
              legend: { show: false },
              series: [
                {
                  type: "pie",
                  radius: ["45%", "70%"],
                  data: userSplit.map((u) => ({
                    name: USER_TYPE_META[u.userType]?.label ?? u.userType,
                    value: u.trips,
                    itemStyle: { color: USER_TYPE_META[u.userType]?.color ?? "#94a3b8" },
                  })),
                  label: { formatter: "{b}: {d}%" },
                },
              ],
            }}
          />
          <IconLegend
            items={userSplit.map((u) => ({
              icon: USER_TYPE_META[u.userType]?.icon ?? UserCheck,
              label: USER_TYPE_META[u.userType]?.label ?? u.userType,
              color: USER_TYPE_META[u.userType]?.color ?? "#94a3b8",
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Top Stations (Geographic Activity Preview)
          </h3>
          <ol className="flex flex-col gap-2 text-sm">
            {topStations.map((s, i) => (
              <li key={s.station_id} className="flex items-center justify-between gap-2">
                <span className="truncate text-[var(--color-text-secondary)]">
                  {i + 1}. {s.name}
                </span>
                <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                  {formatInt(s.total_activity)}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Top Routes</h3>
          <ol className="flex flex-col gap-2 text-sm">
            {topRoutes.map((r, i) => (
              <li key={`${r.start_station_id}-${r.end_station_id}`} className="flex items-center justify-between gap-2">
                <span className="truncate text-[var(--color-text-secondary)]">
                  {i + 1}. {r.start_station_name} → {r.end_station_name}
                </span>
                <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                  {formatInt(r.trips)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-subtle)] p-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
            Key Observations
          </h3>
          <ul className="list-inside list-disc text-sm text-[var(--color-text-secondary)]">
            {insights.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
