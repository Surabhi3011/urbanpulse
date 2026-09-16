"""
Stage 2: build the station master table (stations.json) and the
station x month x direction x user-type cube (station_monthly.json)
used to drive date-range / user-type filtering on the Spatial Explorer
map without shipping station x day granularity.
"""
from __future__ import annotations

import polars as pl

from utils import CLEANED_TRIPS_PATH, write_columnar_json, write_json

MIN_TRIPS_TO_KEEP_STATION = 5  # drop near-empty stray stations from the map


def build_station_identity(trips: pl.LazyFrame) -> pl.LazyFrame:
    starts = trips.select(
        pl.col("start_station_id").alias("station_id"),
        pl.col("start_station_name").alias("name"),
        pl.col("start_lat").alias("lat"),
        pl.col("start_lng").alias("lng"),
    )
    ends = trips.select(
        pl.col("end_station_id").alias("station_id"),
        pl.col("end_station_name").alias("name"),
        pl.col("end_lat").alias("lat"),
        pl.col("end_lng").alias("lng"),
    )
    long = pl.concat([starts, ends], how="vertical_relaxed")

    canonical_name = (
        long.group_by(["station_id", "name"])
        .agg(pl.len().alias("n"))
        .sort(["station_id", "n"], descending=[False, True])
        .group_by("station_id", maintain_order=True)
        .agg(pl.col("name").first().alias("name"))
    )
    canonical_coords = long.group_by("station_id").agg(
        pl.col("lat").mean().alias("lat"),
        pl.col("lng").mean().alias("lng"),
    )
    return canonical_name.join(canonical_coords, on="station_id", how="left")


def main() -> None:
    trips = pl.scan_parquet(CLEANED_TRIPS_PATH)

    identity = build_station_identity(trips)

    starts_agg = trips.group_by(pl.col("start_station_id").alias("station_id")).agg(
        pl.len().alias("starts_count"),
        pl.col("duration_min").mean().alias("avg_start_duration_min"),
        (pl.col("member_casual") == "member").mean().alias("member_share_starts"),
    )
    ends_agg = trips.group_by(pl.col("end_station_id").alias("station_id")).agg(
        pl.len().alias("ends_count")
    )

    top_dest = (
        trips.group_by(["start_station_id", "end_station_id"])
        .agg(pl.len().alias("n"))
        .sort(["start_station_id", "n"], descending=[False, True])
        .group_by("start_station_id", maintain_order=True)
        .agg(pl.col("end_station_id").first().alias("top_destination_id"))
        .rename({"start_station_id": "station_id"})
    )

    stations = (
        identity.join(starts_agg, on="station_id", how="left")
        .join(ends_agg, on="station_id", how="left")
        .join(top_dest, on="station_id", how="left")
        .with_columns(
            pl.col("starts_count").fill_null(0),
            pl.col("ends_count").fill_null(0),
        )
        .with_columns(
            (pl.col("starts_count") + pl.col("ends_count")).alias("total_activity"),
            (pl.col("ends_count") - pl.col("starts_count")).alias("net_flow"),
        )
        .filter(pl.col("total_activity") >= MIN_TRIPS_TO_KEEP_STATION)
        .sort("total_activity", descending=True)
        .collect(engine="streaming")
    )

    stations = stations.with_columns(
        (pl.col("total_activity").rank(method="ordinal", descending=True)).alias("demand_rank")
    )

    dest_name_lookup = dict(
        zip(stations["station_id"].to_list(), stations["name"].to_list())
    )
    stations = stations.with_columns(
        pl.col("top_destination_id")
        .map_elements(lambda sid: dest_name_lookup.get(sid), return_dtype=pl.Utf8)
        .alias("top_destination_name")
    )

    stations_out = stations.select(
        [
            "station_id",
            "name",
            "lat",
            "lng",
            "starts_count",
            "ends_count",
            "total_activity",
            "net_flow",
            "demand_rank",
            pl.col("avg_start_duration_min").round(1).alias("avg_start_duration_min"),
            pl.col("member_share_starts").round(3).alias("member_share_starts"),
            "top_destination_id",
            "top_destination_name",
        ]
    ).to_dicts()
    write_json(stations_out, "stations.json")
    print(f"stations.json: {len(stations_out)} stations")

    kept_ids = set(stations["station_id"].to_list())

    monthly_starts = (
        trips.filter(pl.col("start_station_id").is_in(kept_ids))
        .group_by(
            [
                pl.col("start_station_id").alias("station_id"),
                "month",
                "member_casual",
            ]
        )
        .agg(pl.len().alias("trips"))
        .with_columns(pl.lit("start").alias("direction"))
    )
    monthly_ends = (
        trips.filter(pl.col("end_station_id").is_in(kept_ids))
        .group_by(
            [
                pl.col("end_station_id").alias("station_id"),
                "month",
                "member_casual",
            ]
        )
        .agg(pl.len().alias("trips"))
        .with_columns(pl.lit("end").alias("direction"))
    )
    station_monthly_df = (
        pl.concat([monthly_starts, monthly_ends], how="vertical_relaxed")
        .select(["station_id", "month", "direction", "member_casual", "trips"])
        .collect(engine="streaming")
    )

    station_ids = sorted(station_monthly_df["station_id"].unique().to_list())
    months = sorted(station_monthly_df["month"].unique().to_list())
    directions = ["start", "end"]
    user_types = sorted(station_monthly_df["member_casual"].unique().to_list())
    station_idx = {v: i for i, v in enumerate(station_ids)}
    month_idx = {v: i for i, v in enumerate(months)}
    direction_idx = {v: i for i, v in enumerate(directions)}
    user_idx = {v: i for i, v in enumerate(user_types)}

    rows = [
        [
            station_idx[r["station_id"]],
            month_idx[r["month"]],
            direction_idx[r["direction"]],
            user_idx[r["member_casual"]],
            r["trips"],
        ]
        for r in station_monthly_df.to_dicts()
    ]

    write_columnar_json(
        dims={
            "station_ids": station_ids,
            "months": months,
            "directions": directions,
            "user_types": user_types,
        },
        columns=["station_idx", "month_idx", "direction_idx", "user_type_idx", "trips"],
        rows=rows,
        filename="station_monthly.json",
    )
    print(f"station_monthly.json: {len(rows)} rows")


if __name__ == "__main__":
    main()
