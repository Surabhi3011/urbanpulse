// Types mirroring the JSON files produced by scripts/*.py (see scripts/utils.py
// write_json / write_columnar_json). Keep these in sync with the pipeline output.

export interface Station {
  station_id: string;
  name: string;
  lat: number;
  lng: number;
  starts_count: number;
  ends_count: number;
  total_activity: number;
  net_flow: number;
  demand_rank: number;
  avg_start_duration_min: number;
  member_share_starts: number;
  top_destination_id: string | null;
  top_destination_name: string | null;
}

export interface RouteMetric {
  start_station_id: string;
  start_station_name: string;
  start_lat: number;
  start_lng: number;
  end_station_id: string;
  end_station_name: string;
  end_lat: number;
  end_lng: number;
  trips: number;
  avg_duration_min: number;
  member_share: number;
}

/** Generic decoded shape for the two columnar fact tables. */
export interface ColumnarTable<TDims extends Record<string, string[]>> {
  dims: TDims;
  columns: string[];
  rows: number[][];
}

export type TemporalCubeRaw = ColumnarTable<{
  dates: string[];
  user_types: string[];
  bike_types: string[];
}>;

/** date x hour x member_casual x rideable_type -- the primary filter-driven fact table. */
export interface TemporalCubeRow {
  date: string;
  hour: number;
  userType: string;
  bikeType: string;
  trips: number;
  durationSumMin: number;
}

export type StationMonthlyRaw = ColumnarTable<{
  station_ids: string[];
  months: string[];
  directions: string[];
  user_types: string[];
}>;

export interface StationMonthlyRow {
  stationId: string;
  month: string;
  direction: "start" | "end";
  userType: string;
  trips: number;
}

export interface AnomalyDay {
  date: string;
  weekday: number;
  trips: number;
  weekday_median: number;
  residual: number;
  modified_z: number;
  is_anomaly: boolean;
  direction: "spike" | "drop";
}

export interface AnomaliesFile {
  method: string;
  baseline_window_days: number;
  threshold: number;
  days: AnomalyDay[];
}

export interface ForecastPoint {
  date: string;
  trips?: number;
  forecast_trips?: number;
}

export interface ForecastsFile {
  method: string;
  trailing_window_days: number;
  horizon_days: number;
  trend_slope_per_day: number;
  historical: { date: string; trips: number }[];
  forecast: { date: string; forecast_trips: number }[];
}

export interface DurationHistogramFile {
  bin_order: string[];
  counts: { bin: string; member_casual: string; trips: number }[];
  percentiles_min: Record<string, number>;
}

export interface Meta {
  dataset: {
    name: string;
    source_url: string;
    publisher: string;
    license_note: string;
    date_range: { start: string; end: string };
    geographic_coverage: string;
  };
  record_counts: {
    total_raw: number;
    dropped_invalid_timestamp: number;
    dropped_invalid_duration: number;
    dropped_missing_coords: number;
    dropped_depot_station: number;
    dropped_out_of_range_date: number;
    total_cleaned: number;
    elapsed_sec: number;
  };
  stations: { count_after_cleaning: number };
  routes: { top_routes_shipped: number };
  cleaning_steps: string[];
  aggregation_grains: Record<string, string>;
  anomaly_method: { method: string; threshold: number; description: string };
  forecast_method: {
    method: string;
    trailing_window_days: number;
    horizon_days: number;
    description: string;
  };
  known_limitations: string[];
  architecture: string;
  generated_at: string;
}

export interface UrbanPulseData {
  stations: Station[];
  stationMonthly: StationMonthlyRow[];
  temporalCube: TemporalCubeRow[];
  routes: RouteMetric[];
  anomalies: AnomaliesFile;
  forecasts: ForecastsFile;
  durationHistogram: DurationHistogramFile;
  meta: Meta;
}
