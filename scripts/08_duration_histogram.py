"""
Stage 8: build duration_histogram.json -- a binned trip-duration
distribution (with a member/casual split), for the Advanced Analytics
page. Individual trip durations are never shipped to the browser (only
temporal_cube.json's summed duration per cell is); this is the one
additional small aggregate needed to render a duration distribution
without shipping raw trip-level data.
"""
from __future__ import annotations

import polars as pl

from utils import CLEANED_TRIPS_PATH, write_json

# (label, inclusive lower bound, exclusive upper bound in minutes)
BINS = [
    ("0-5", 0, 5),
    ("5-10", 5, 10),
    ("10-15", 10, 15),
    ("15-20", 15, 20),
    ("20-25", 20, 25),
    ("25-30", 25, 30),
    ("30-45", 30, 45),
    ("45-60", 45, 60),
    ("60-90", 60, 90),
    ("90-120", 90, 120),
    ("120+", 120, 24 * 60 + 1),
]


def main() -> None:
    trips = pl.scan_parquet(CLEANED_TRIPS_PATH)

    bin_expr = pl.when(pl.lit(False)).then(pl.lit(None, dtype=pl.Utf8))
    for label, lo, hi in BINS:
        bin_expr = bin_expr.when(
            (pl.col("duration_min") >= lo) & (pl.col("duration_min") < hi)
        ).then(pl.lit(label))
    bin_expr = bin_expr.otherwise(pl.lit(BINS[-1][0])).alias("bin")

    counts = (
        trips.with_columns(bin_expr)
        .group_by(["bin", "member_casual"])
        .agg(pl.len().alias("trips"))
        .collect(engine="streaming")
        .to_dicts()
    )

    percentiles = (
        trips.select(
            pl.col("duration_min").quantile(q).alias(f"p{int(q * 100)}")
            for q in [0.1, 0.25, 0.5, 0.75, 0.9, 0.99]
        )
        .collect(engine="streaming")
        .to_dicts()[0]
    )

    write_json(
        {
            "bin_order": [b[0] for b in BINS],
            "counts": counts,
            "percentiles_min": {k: round(v, 1) for k, v in percentiles.items()},
        },
        "duration_histogram.json",
    )
    print(f"duration_histogram.json: {len(counts)} bin x user-type rows")
    print("percentiles (min):", percentiles)


if __name__ == "__main__":
    main()
