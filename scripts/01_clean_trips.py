"""
Stage 1: scan all raw Citi Bike CSVs, clean, and write a build-time
intermediate Parquet file. This Parquet file is never shipped to the
frontend -- it exists only so later pipeline stages don't have to
re-parse ~20M CSV rows each time.

Cleaning rules (documented in the Methodology page / data dictionary):
  - drop rows with unparseable start/end timestamps, or end <= start
  - drop rows with trip duration < 1 second or > 24 hours
  - drop rows missing start/end latitude or longitude
  - drop rows whose station looks like a depot/shop/system pseudo-station
    (e.g. ids prefixed "SYS", names containing "shop"/"warehouse"/"depot")
  - normalize station ids by stripping trailing non-alphanumeric artifacts
    (observed in the raw data, e.g. "5303.06_" -> "5303.06")
"""
from __future__ import annotations

import json
import os
import time

import polars as pl

from utils import (
    CLEANED_TRIPS_PATH,
    DATASET_END_DATE,
    DATASET_START_DATE,
    INTERMEDIATE_DIR,
    MAX_DURATION_HOURS,
    MIN_DURATION_MIN,
    ensure_dirs,
    is_depot_expr,
    normalize_station_id_expr,
    raw_csv_paths,
)

SCHEMA_OVERRIDES = {
    "ride_id": pl.Utf8,
    "rideable_type": pl.Utf8,
    "started_at": pl.Utf8,
    "ended_at": pl.Utf8,
    "start_station_name": pl.Utf8,
    "start_station_id": pl.Utf8,
    "end_station_name": pl.Utf8,
    "end_station_id": pl.Utf8,
    "start_lat": pl.Float64,
    "start_lng": pl.Float64,
    "end_lat": pl.Float64,
    "end_lng": pl.Float64,
    "member_casual": pl.Utf8,
}


def main() -> None:
    ensure_dirs()
    t0 = time.time()
    paths = raw_csv_paths()
    print(f"Found {len(paths)} raw CSV files")

    lf = pl.scan_csv(
        paths,
        schema_overrides=SCHEMA_OVERRIDES,
        try_parse_dates=False,
    )

    lf = lf.with_columns(
        [
            pl.col("started_at").str.to_datetime(strict=False).alias("started_at"),
            pl.col("ended_at").str.to_datetime(strict=False).alias("ended_at"),
            normalize_station_id_expr("start_station_id").alias("start_station_id"),
            normalize_station_id_expr("end_station_id").alias("end_station_id"),
            pl.col("member_casual").str.to_lowercase(),
            pl.col("rideable_type").str.to_lowercase(),
        ]
    )

    lf = lf.with_columns(
        [
            ((pl.col("ended_at") - pl.col("started_at")).dt.total_seconds() / 60.0).alias(
                "duration_min"
            )
        ]
    )

    bad_time = (
        pl.col("started_at").is_null()
        | pl.col("ended_at").is_null()
        | (pl.col("ended_at") <= pl.col("started_at"))
    )
    bad_duration = pl.col("duration_min").is_null() | (
        pl.col("duration_min") < MIN_DURATION_MIN
    ) | (pl.col("duration_min") > MAX_DURATION_HOURS * 60)
    missing_coords = (
        pl.col("start_lat").is_null()
        | pl.col("start_lng").is_null()
        | pl.col("end_lat").is_null()
        | pl.col("end_lng").is_null()
    )
    is_depot = is_depot_expr("start_station_name", "start_station_id") | is_depot_expr(
        "end_station_name", "end_station_id"
    )
    out_of_range = (
        pl.col("started_at").dt.date() < pl.lit(DATASET_START_DATE).str.to_date()
    ) | (pl.col("started_at").dt.date() > pl.lit(DATASET_END_DATE).str.to_date())

    lf = lf.with_columns(
        [
            bad_time.alias("_bad_time"),
            bad_duration.alias("_bad_duration"),
            missing_coords.alias("_missing_coords"),
            is_depot.alias("_is_depot"),
            (out_of_range & ~bad_time).alias("_out_of_range"),
        ]
    )

    stats_lf = lf.select(
        [
            pl.len().alias("total_raw"),
            pl.col("_bad_time").sum().alias("dropped_invalid_timestamp"),
            pl.col("_bad_duration").sum().alias("dropped_invalid_duration"),
            pl.col("_missing_coords").sum().alias("dropped_missing_coords"),
            pl.col("_is_depot").sum().alias("dropped_depot_station"),
            pl.col("_out_of_range").sum().alias("dropped_out_of_range_date"),
        ]
    )
    stats = stats_lf.collect(engine="streaming").to_dicts()[0]
    print("Row-level issue counts (overlapping, not mutually exclusive):", stats)

    valid = (
        ~pl.col("_bad_time")
        & ~pl.col("_bad_duration")
        & ~pl.col("_missing_coords")
        & ~pl.col("_is_depot")
        & ~pl.col("_out_of_range")
    )

    cleaned = lf.filter(valid).select(
        [
            pl.col("started_at"),
            pl.col("started_at").dt.date().alias("trip_date"),
            pl.col("started_at").dt.hour().alias("hour"),
            pl.col("started_at").dt.weekday().alias("weekday"),
            pl.col("started_at").dt.strftime("%Y-%m").alias("month"),
            pl.col("member_casual"),
            pl.col("rideable_type"),
            pl.col("duration_min"),
            pl.col("start_station_id"),
            pl.col("start_station_name"),
            pl.col("start_lat"),
            pl.col("start_lng"),
            pl.col("end_station_id"),
            pl.col("end_station_name"),
            pl.col("end_lat"),
            pl.col("end_lng"),
        ]
    )

    cleaned.sink_parquet(CLEANED_TRIPS_PATH, engine="streaming")

    total_cleaned = pl.scan_parquet(CLEANED_TRIPS_PATH).select(pl.len()).collect().item()
    stats["total_cleaned"] = total_cleaned
    stats["elapsed_sec"] = round(time.time() - t0, 1)
    print("Final:", stats)

    with open(os.path.join(INTERMEDIATE_DIR, "clean_stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print(f"Wrote cleaned trips to {CLEANED_TRIPS_PATH}")


if __name__ == "__main__":
    main()
