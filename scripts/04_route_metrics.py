"""
Stage 4: build route_metrics.json -- the top origin-destination station
pairs by trip volume, for the Network Explorer's flow-line view and
route ranking table. This is explicitly "top routes by volume," not an
exhaustive OD matrix (a full station x station matrix would be ~6M
possible pairs and analytically noisy at the tail).
"""
from __future__ import annotations

import json
import os

import polars as pl

from utils import CLEANED_TRIPS_PATH, OUTPUT_DIR, write_json

TOP_N_ROUTES = 300


def main() -> None:
    trips = pl.scan_parquet(CLEANED_TRIPS_PATH)

    with open(os.path.join(OUTPUT_DIR, "stations.json"), encoding="utf-8") as f:
        stations = {s["station_id"]: s for s in json.load(f)}

    routes = (
        trips.filter(pl.col("start_station_id") != pl.col("end_station_id"))
        .group_by(["start_station_id", "end_station_id"])
        .agg(
            pl.len().alias("trips"),
            pl.col("duration_min").mean().round(1).alias("avg_duration_min"),
            (pl.col("member_casual") == "member").mean().round(3).alias("member_share"),
        )
        .sort("trips", descending=True)
        .limit(TOP_N_ROUTES)
        .collect(engine="streaming")
        .to_dicts()
    )

    out = []
    for r in routes:
        start = stations.get(r["start_station_id"])
        end = stations.get(r["end_station_id"])
        if not start or not end:
            continue
        out.append(
            {
                "start_station_id": r["start_station_id"],
                "start_station_name": start["name"],
                "start_lat": start["lat"],
                "start_lng": start["lng"],
                "end_station_id": r["end_station_id"],
                "end_station_name": end["name"],
                "end_lat": end["lat"],
                "end_lng": end["lng"],
                "trips": r["trips"],
                "avg_duration_min": r["avg_duration_min"],
                "member_share": r["member_share"],
            }
        )

    write_json(out, "route_metrics.json")
    print(f"route_metrics.json: {len(out)} routes (top {TOP_N_ROUTES} by volume)")


if __name__ == "__main__":
    main()
