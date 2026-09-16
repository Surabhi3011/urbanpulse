"""
Stage 7: build meta.json -- dataset & pipeline metadata consumed by the
Methodology page and referenced in the README. Nothing here is
fabricated; every figure is read back from the outputs of the earlier
stages so this file can't drift out of sync with what was actually
computed.
"""
from __future__ import annotations

import datetime as dt
import json
import os

from utils import INTERMEDIATE_DIR, OUTPUT_DIR, write_json


def load(path: str):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    clean_stats = load(os.path.join(INTERMEDIATE_DIR, "clean_stats.json"))
    cube = load(os.path.join(OUTPUT_DIR, "temporal_cube.json"))
    stations = load(os.path.join(OUTPUT_DIR, "stations.json"))
    routes = load(os.path.join(OUTPUT_DIR, "route_metrics.json"))
    anomalies = load(os.path.join(OUTPUT_DIR, "anomalies.json"))
    forecasts = load(os.path.join(OUTPUT_DIR, "forecasts.json"))

    dates = cube["dims"]["dates"]

    meta = {
        "dataset": {
            "name": "NYC Citi Bike System Data",
            "source_url": "https://citibikenyc.com/system-data",
            "publisher": "Lyft Bikes and Scooters, LLC",
            "license_note": (
                "Published by Lyft/Citi Bike as open system data for public exploration. "
                "This project uses it for non-commercial, educational/portfolio analysis; "
                "verify current terms at the source URL before any other use."
            ),
            "date_range": {"start": dates[0], "end": dates[-1]},
            "geographic_coverage": "New York City Citi Bike system (all stations present in the raw files)",
        },
        "record_counts": clean_stats,
        "stations": {"count_after_cleaning": len(stations)},
        "routes": {"top_routes_shipped": len(routes)},
        "cleaning_steps": [
            "Parsed started_at/ended_at timestamps; dropped rows where parsing failed or end <= start.",
            "Computed trip duration in minutes; dropped trips shorter than 1 second or longer than 24 hours.",
            "Dropped rows missing start or end latitude/longitude.",
            "Dropped a small number of trips starting outside Jan 1 - Jun 30, 2026 (a boundary artifact where the raw 'January' export included a few trips from the final minutes of the prior Dec 31), to keep whole calendar months.",
            "Dropped trips at depot/shop/system pseudo-stations (e.g. ids prefixed 'SYS', names containing 'shop'/'warehouse'/'depot') -- not real public docking stations.",
            "Normalized station ids by stripping trailing non-alphanumeric artifacts observed in the raw export.",
            "Derived each station's canonical name (most frequent observed name) and coordinates (mean of observed lat/lng) across all its trips.",
        ],
        "aggregation_grains": {
            "temporal_cube.json": "date x hour x member_casual x rideable_type",
            "stations.json": "one row per station, whole-period totals",
            "station_monthly.json": "station x month x direction(start/end) x member_casual",
            "route_metrics.json": f"top {len(routes)} origin-destination station pairs by trip volume",
        },
        "anomaly_method": {
            "method": anomalies["method"],
            "threshold": anomalies["threshold"],
            "description": (
                "Modified z-score (Iglewicz & Hoaglin) of each day's deviation from its own "
                "weekday's median trip count across the dataset, so normal weekly patterns "
                "aren't flagged as anomalies. Flags statistical outliers in the observed data; "
                "does not claim to identify confirmed real-world incidents."
            ),
        },
        "forecast_method": {
            "method": forecasts["method"],
            "trailing_window_days": forecasts["trailing_window_days"],
            "horizon_days": forecasts["horizon_days"],
            "description": (
                "Linear trend fit over the trailing window, adjusted by a day-of-week "
                "seasonal index computed over the same window. A simple, interpretable "
                "baseline -- not a production-grade forecasting model."
            ),
        },
        "known_limitations": [
            "Station-level filtering on the Spatial Explorer is month-grain, not day-grain, to keep shipped data small.",
            "Route metrics show only the top origin-destination pairs by volume, not an exhaustive station-to-station matrix.",
            "Trip duration reflects dock-to-dock time and may include pauses, not just active riding time.",
            "Forecasts are a simple statistical baseline and should not be read as precise predictions.",
            "Anomaly flags mark statistical outliers only; they are not verified real-world events.",
        ],
        "architecture": "Static frontend (React/Vite) reading pre-aggregated JSON produced by an offline Python (Polars) pipeline. No backend, database, or authentication.",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }

    write_json(meta, "meta.json")
    print("meta.json written")
    print(json.dumps(meta["dataset"], indent=2))


if __name__ == "__main__":
    main()
