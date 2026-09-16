"""Shared helpers for the UrbanPulse data pipeline."""
from __future__ import annotations

import glob
import os

import polars as pl

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "DataRaw")
INTERMEDIATE_DIR = os.path.join(os.path.dirname(__file__), "..", "data_build")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")
CLEANED_TRIPS_PATH = os.path.join(INTERMEDIATE_DIR, "trips_cleaned.parquet")

# Trip duration bounds used to drop clearly invalid records.
MIN_DURATION_MIN = 1 / 60  # 1 second
MAX_DURATION_HOURS = 24

# The raw monthly export files bleed a handful of trips across month
# boundaries (e.g. the "January" file contains a few trips starting in the
# final minutes of the prior Dec 31). Clamping to whole calendar months
# avoids a misleading partial-data day at the edge of the date range.
DATASET_START_DATE = "2026-01-01"
DATASET_END_DATE = "2026-06-30"

# Depot / shop / system pseudo-stations that aren't real public docking stations.
# Matched case-insensitively against station name, and by prefix against station id.
DEPOT_NAME_PATTERNS = ["shop", "warehouse", "depot", "workbench", "lab -"]
DEPOT_ID_PREFIXES = ["SYS"]


def raw_csv_paths() -> list[str]:
    paths = sorted(glob.glob(os.path.join(RAW_DATA_DIR, "**", "*.csv"), recursive=True))
    if not paths:
        raise FileNotFoundError(f"No raw CSV files found under {RAW_DATA_DIR}")
    return paths


def ensure_dirs() -> None:
    os.makedirs(INTERMEDIATE_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def is_depot_expr(name_col: str, id_col: str) -> pl.Expr:
    """Boolean expression: True when a row's station looks like a depot/shop pseudo-station."""
    name_lower = pl.col(name_col).str.to_lowercase()
    name_hit = pl.any_horizontal([name_lower.str.contains(p) for p in DEPOT_NAME_PATTERNS])
    id_hit = pl.any_horizontal([pl.col(id_col).str.starts_with(p) for p in DEPOT_ID_PREFIXES])
    return name_hit.fill_null(False) | id_hit.fill_null(False)


def normalize_station_id_expr(col: str) -> pl.Expr:
    """Strip trailing non-alphanumeric artifacts from a station id (e.g. '5303.06_' -> '5303.06')."""
    return pl.col(col).str.strip_chars_end("_").str.strip_chars()


def write_json(obj, filename: str) -> str:
    import json

    ensure_dirs()
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, separators=(",", ":"), default=str)
    return path


def write_columnar_json(dims: dict[str, list], columns: list[str], rows: list[list], filename: str) -> str:
    """Write a compact fact table: shared dimension value-lists (looked up by
    index) plus a `columns` header and plain `rows` arrays -- avoids repeating
    full key names across every row of a large table. `dims` maps a dimension
    name (e.g. "dates") to its ordered distinct values; row values that
    reference a dimension are integer indices into that list.
    """
    return write_json({"dims": dims, "columns": columns, "rows": rows}, filename)
