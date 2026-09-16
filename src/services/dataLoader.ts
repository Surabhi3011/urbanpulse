import type {
  AnomaliesFile,
  DurationHistogramFile,
  ForecastsFile,
  Meta,
  RouteMetric,
  Station,
  StationMonthlyRaw,
  StationMonthlyRow,
  TemporalCubeRaw,
  TemporalCubeRow,
  UrbanPulseData,
} from "../types/data";

const DATA_BASE = `${import.meta.env.BASE_URL}data`;

async function fetchJson<T>(filename: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}/${filename}`);
  if (!res.ok) {
    throw new Error(`Failed to load ${filename}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

function decodeTemporalCube(raw: TemporalCubeRaw): TemporalCubeRow[] {
  const { dates, user_types, bike_types } = raw.dims;
  const col = Object.fromEntries(raw.columns.map((name, i) => [name, i]));
  return raw.rows.map((row) => ({
    date: dates[row[col.date_idx]],
    hour: row[col.hour],
    userType: user_types[row[col.user_type_idx]],
    bikeType: bike_types[row[col.bike_type_idx]],
    trips: row[col.trips],
    durationSumMin: row[col.duration_sum_min],
  }));
}

function decodeStationMonthly(raw: StationMonthlyRaw): StationMonthlyRow[] {
  const { station_ids, months, directions, user_types } = raw.dims;
  const col = Object.fromEntries(raw.columns.map((name, i) => [name, i]));
  return raw.rows.map((row) => ({
    stationId: station_ids[row[col.station_idx]],
    month: months[row[col.month_idx]],
    direction: directions[row[col.direction_idx]] as "start" | "end",
    userType: user_types[row[col.user_type_idx]],
    trips: row[col.trips],
  }));
}

export async function loadUrbanPulseData(): Promise<UrbanPulseData> {
  const [
    stations,
    temporalCubeRaw,
    stationMonthlyRaw,
    routes,
    anomalies,
    forecasts,
    durationHistogram,
    meta,
  ] = await Promise.all([
    fetchJson<Station[]>("stations.json"),
    fetchJson<TemporalCubeRaw>("temporal_cube.json"),
    fetchJson<StationMonthlyRaw>("station_monthly.json"),
    fetchJson<RouteMetric[]>("route_metrics.json"),
    fetchJson<AnomaliesFile>("anomalies.json"),
    fetchJson<ForecastsFile>("forecasts.json"),
    fetchJson<DurationHistogramFile>("duration_histogram.json"),
    fetchJson<Meta>("meta.json"),
  ]);

  return {
    stations,
    temporalCube: decodeTemporalCube(temporalCubeRaw),
    stationMonthly: decodeStationMonthly(stationMonthlyRaw),
    routes,
    anomalies,
    forecasts,
    durationHistogram,
    meta,
  };
}
