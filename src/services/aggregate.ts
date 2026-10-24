// Centralized filter + aggregation layer. This is the ONLY place that reads
// the raw fact tables and derives KPIs/series/comparisons. Pages and
// components must go through these functions rather than computing their
// own filtered metrics, so calculations stay consistent everywhere.
import type {
  RouteMetric,
  Station,
  StationMonthlyRow,
  TemporalCubeRow,
} from "../types/data";
import type { FilterState } from "../types/filters";

export function dateToUtcDay(date: string): number {
  // 0 = Sunday .. 6 = Saturday. Parsed as UTC so it never shifts with the
  // viewer's local timezone.
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function isWeekendDate(date: string): boolean {
  const d = dateToUtcDay(date);
  return d === 0 || d === 6;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** Applies date range, day-type, hour range, user-type and bike-type filters.
 * Station-scoped filters (stationId/origin/destination) don't apply here --
 * the temporal cube has no station dimension. Callers should show a
 * "doesn't apply to this view" note when a station filter is active. */
export function filterTemporalCube(
  rows: TemporalCubeRow[],
  f: FilterState
): TemporalCubeRow[] {
  return rows.filter((r) => {
    if (r.date < f.startDate || r.date > f.endDate) return false;
    if (r.hour < f.hourStart || r.hour > f.hourEnd) return false;
    if (f.dayType !== "all") {
      const weekend = isWeekendDate(r.date);
      if (f.dayType === "weekend" && !weekend) return false;
      if (f.dayType === "weekday" && weekend) return false;
    }
    if (f.userType && r.userType !== f.userType) return false;
    if (f.bikeType && r.bikeType !== f.bikeType) return false;
    return true;
  });
}

export interface DailyPoint {
  date: string;
  trips: number;
  durationSumMin: number;
}

export function dailyTotals(rows: TemporalCubeRow[]): DailyPoint[] {
  const map = new Map<string, DailyPoint>();
  for (const r of rows) {
    const entry = map.get(r.date) ?? { date: r.date, trips: 0, durationSumMin: 0 };
    entry.trips += r.trips;
    entry.durationSumMin += r.durationSumMin;
    map.set(r.date, entry);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function monthlyTotals(rows: TemporalCubeRow[]): { month: string; trips: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const m = monthOf(r.date);
    map.set(m, (map.get(m) ?? 0) + r.trips);
  }
  return [...map.entries()]
    .map(([month, trips]) => ({ month, trips }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function hourlyProfile(rows: TemporalCubeRow[]): { hour: number; trips: number }[] {
  const totals = new Array(24).fill(0);
  for (const r of rows) totals[r.hour] += r.trips;
  return totals.map((trips, hour) => ({ hour, trips }));
}

/** 0 = Sunday .. 6 = Saturday, matching dateToUtcDay. */
export function weekdayProfile(rows: TemporalCubeRow[]): { weekday: number; trips: number }[] {
  const totals = new Array(7).fill(0);
  for (const r of rows) totals[dateToUtcDay(r.date)] += r.trips;
  return totals.map((trips, weekday) => ({ weekday, trips }));
}

/** [weekday][hour] trip counts. */
export function hourByWeekdayHeatmap(rows: TemporalCubeRow[]): number[][] {
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const r of rows) grid[dateToUtcDay(r.date)][r.hour] += r.trips;
  return grid;
}

export function userTypeSplit(rows: TemporalCubeRow[]): { userType: string; trips: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.userType, (map.get(r.userType) ?? 0) + r.trips);
  return [...map.entries()].map(([userType, trips]) => ({ userType, trips }));
}

export function bikeTypeSplit(rows: TemporalCubeRow[]): { bikeType: string; trips: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.bikeType, (map.get(r.bikeType) ?? 0) + r.trips);
  return [...map.entries()].map(([bikeType, trips]) => ({ bikeType, trips }));
}

export function durationDistributionInputs(rows: TemporalCubeRow[]): {
  totalTrips: number;
  totalDurationMin: number;
  avgDurationMin: number;
} {
  const totalTrips = rows.reduce((s, r) => s + r.trips, 0);
  const totalDurationMin = rows.reduce((s, r) => s + r.durationSumMin, 0);
  return {
    totalTrips,
    totalDurationMin,
    avgDurationMin: totalTrips > 0 ? totalDurationMin / totalTrips : 0,
  };
}

export interface KpiSummary {
  totalTrips: number;
  avgDailyTrips: number;
  avgDurationMin: number;
  activeStations: number;
  peakHour: number | null;
  memberShare: number | null;
  topStation: { name: string; trips: number } | null;
  topRoute: { label: string; trips: number } | null;
}

export function computeKpis(
  rows: TemporalCubeRow[],
  stations: Station[],
  routes: RouteMetric[]
): KpiSummary {
  const { totalTrips, avgDurationMin } = durationDistributionInputs(rows);
  const days = new Set(rows.map((r) => r.date)).size;
  const avgDailyTrips = days > 0 ? totalTrips / days : 0;

  const hourly = hourlyProfile(rows);
  const peak = hourly.reduce((best, cur) => (cur.trips > best.trips ? cur : best), hourly[0]);

  const users = userTypeSplit(rows);
  const memberTrips = users.find((u) => u.userType === "member")?.trips ?? 0;
  const memberShare = totalTrips > 0 ? memberTrips / totalTrips : null;

  const topStationEntry = stations[0];
  const topRouteEntry = routes[0];

  return {
    totalTrips,
    avgDailyTrips,
    avgDurationMin,
    activeStations: stations.length,
    peakHour: rows.length > 0 ? peak.hour : null,
    memberShare,
    topStation: topStationEntry
      ? { name: topStationEntry.name, trips: topStationEntry.total_activity }
      : null,
    topRoute: topRouteEntry
      ? {
          label: `${topRouteEntry.start_station_name} -> ${topRouteEntry.end_station_name}`,
          trips: topRouteEntry.trips,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Station / route filtering (Spatial & Network Explorer)
// ---------------------------------------------------------------------------

export function filterStationMonthly(
  rows: StationMonthlyRow[],
  f: FilterState
): StationMonthlyRow[] {
  const startMonth = monthOf(f.startDate);
  const endMonth = monthOf(f.endDate);
  return rows.filter((r) => {
    if (r.month < startMonth || r.month > endMonth) return false;
    if (f.userType && r.userType !== f.userType) return false;
    return true;
  });
}

export interface StationActivity {
  stationId: string;
  starts: number;
  ends: number;
  total: number;
}

export function stationActivityFromMonthly(rows: StationMonthlyRow[]): Map<string, StationActivity> {
  const map = new Map<string, StationActivity>();
  for (const r of rows) {
    const entry = map.get(r.stationId) ?? { stationId: r.stationId, starts: 0, ends: 0, total: 0 };
    if (r.direction === "start") entry.starts += r.trips;
    else entry.ends += r.trips;
    entry.total = entry.starts + entry.ends;
    map.set(r.stationId, entry);
  }
  return map;
}

export function filterRoutes(routes: RouteMetric[], f: FilterState): RouteMetric[] {
  return routes.filter((r) => {
    if (f.stationId && r.start_station_id !== f.stationId && r.end_station_id !== f.stationId)
      return false;
    if (f.originStationId && r.start_station_id !== f.originStationId) return false;
    if (f.destinationStationId && r.end_station_id !== f.destinationStationId) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Period comparisons
// ---------------------------------------------------------------------------

export interface Comparison {
  current: number;
  baseline: number;
  absoluteDiff: number;
  /** null when the baseline is zero/unavailable -- never show a misleading % */
  pctDiff: number | null;
}

export function compare(current: number, baseline: number): Comparison {
  return {
    current,
    baseline,
    absoluteDiff: current - baseline,
    pctDiff: baseline > 0 ? ((current - baseline) / baseline) * 100 : null,
  };
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Current filtered range vs. the immediately preceding period of equal length. */
export function compareCurrentVsPreviousPeriod(
  allRows: TemporalCubeRow[],
  f: FilterState
): Comparison {
  const current = filterTemporalCube(allRows, f);
  const currentTotal = current.reduce((s, r) => s + r.trips, 0);

  const spanDays =
    Math.round(
      (new Date(`${f.endDate}T00:00:00Z`).getTime() -
        new Date(`${f.startDate}T00:00:00Z`).getTime()) /
        86400000
    ) + 1;
  const prevEnd = shiftDate(f.startDate, -1);
  const prevStart = shiftDate(f.startDate, -spanDays);
  const previous = filterTemporalCube(allRows, { ...f, startDate: prevStart, endDate: prevEnd });
  const previousTotal = previous.reduce((s, r) => s + r.trips, 0);

  return compare(currentTotal, previousTotal);
}

export function compareWeekdayVsWeekend(rows: TemporalCubeRow[]): {
  weekday: number;
  weekend: number;
} {
  let weekday = 0;
  let weekend = 0;
  for (const r of rows) {
    if (isWeekendDate(r.date)) weekend += r.trips;
    else weekday += r.trips;
  }
  return { weekday, weekend };
}

export function compareStationVsSystemAverage(stations: Station[], stationId: string): Comparison | null {
  const station = stations.find((s) => s.station_id === stationId);
  if (!station || stations.length === 0) return null;
  const systemAvg = stations.reduce((s, x) => s + x.total_activity, 0) / stations.length;
  return compare(station.total_activity, systemAvg);
}

export function compareRouteVsSystemAverage(routes: RouteMetric[], routeKey: string): Comparison | null {
  const route = routes.find((r) => `${r.start_station_id}->${r.end_station_id}` === routeKey);
  if (!route || routes.length === 0) return null;
  const systemAvg = routes.reduce((s, r) => s + r.trips, 0) / routes.length;
  return compare(route.trips, systemAvg);
}

/** Filtered segment vs. the unfiltered whole-dataset baseline. */
export function compareFilteredVsBaseline(
  allRows: TemporalCubeRow[],
  f: FilterState,
  fullRangeDefaults: Pick<FilterState, "startDate" | "endDate">
): Comparison {
  const filtered = filterTemporalCube(allRows, f);
  const filteredTotal = filtered.reduce((s, r) => s + r.trips, 0);
  const baseline = filterTemporalCube(allRows, {
    ...f,
    startDate: fullRangeDefaults.startDate,
    endDate: fullRangeDefaults.endDate,
    dayType: "all",
    hourStart: 0,
    hourEnd: 23,
    userType: null,
    bikeType: null,
  });
  const baselineTotal = baseline.reduce((s, r) => s + r.trips, 0);
  return compare(filteredTotal, baselineTotal);
}
