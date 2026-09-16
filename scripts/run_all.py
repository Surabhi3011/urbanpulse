"""Run the full UrbanPulse data pipeline in order."""
from __future__ import annotations

import runpy
import time

STAGES = [
    "01_clean_trips",
    "02_build_stations",
    "03_temporal_cube",
    "04_route_metrics",
    "05_anomalies",
    "06_forecast",
    "07_meta",
    "08_duration_histogram",
]


def main() -> None:
    for stage in STAGES:
        print(f"\n=== {stage} ===")
        t0 = time.time()
        runpy.run_module(stage, run_name="__main__")
        print(f"({stage} took {time.time() - t0:.1f}s)")


if __name__ == "__main__":
    main()
