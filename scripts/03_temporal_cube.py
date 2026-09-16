"""
Stage 3: build temporal_cube.json -- the primary filter-driven fact table.

Grain: date x hour x member_casual x rideable_type.
Stores trip counts and summed duration (not averages) so the frontend
can correctly re-aggregate averages across any combination of filtered
cells without weighting errors.
"""
from __future__ import annotations

import polars as pl

from utils import CLEANED_TRIPS_PATH, write_columnar_json


def main() -> None:
    trips = pl.scan_parquet(CLEANED_TRIPS_PATH)

    cube = (
        trips.group_by(["trip_date", "hour", "member_casual", "rideable_type"])
        .agg(
            pl.len().alias("trips"),
            pl.col("duration_min").sum().round(2).alias("duration_sum_min"),
        )
        .sort(["trip_date", "hour"])
        .collect(engine="streaming")
        .with_columns(pl.col("trip_date").cast(pl.Utf8))
    )

    dates = sorted(cube["trip_date"].unique().to_list())
    user_types = sorted(cube["member_casual"].unique().to_list())
    bike_types = sorted(cube["rideable_type"].unique().to_list())
    date_idx = {v: i for i, v in enumerate(dates)}
    user_idx = {v: i for i, v in enumerate(user_types)}
    bike_idx = {v: i for i, v in enumerate(bike_types)}

    rows = [
        [
            date_idx[r["trip_date"]],
            r["hour"],
            user_idx[r["member_casual"]],
            bike_idx[r["rideable_type"]],
            r["trips"],
            r["duration_sum_min"],
        ]
        for r in cube.to_dicts()
    ]

    write_columnar_json(
        dims={"dates": dates, "user_types": user_types, "bike_types": bike_types},
        columns=["date_idx", "hour", "user_type_idx", "bike_type_idx", "trips", "duration_sum_min"],
        rows=rows,
        filename="temporal_cube.json",
    )
    print(f"temporal_cube.json: {len(rows)} rows")
    print(f"date range: {dates[0]} to {dates[-1]}")
    print(f"total trips in cube: {cube['trips'].sum()}")


if __name__ == "__main__":
    main()
