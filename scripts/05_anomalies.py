"""
Stage 5: build anomalies.json from the daily trip series.

Method: modified z-score (Iglewicz & Hoaglin) of each day's deviation
from a *local* same-weekday baseline (median trip count on the same
weekday within a +/-21 day window). A local rather than dataset-wide
weekday baseline matters here because ridership roughly triples from
January to June -- comparing against the whole-dataset weekday median
would conflate that seasonal trend with anomaly residuals and mask
real outliers. |modified z| > 3.5 is the conventional threshold for
this method and is what's used here.

This flags statistical outliers in the observed data. It does not
claim to identify real-world incidents (weather, service disruptions,
etc.) -- see the Methodology page for this caveat.
"""
from __future__ import annotations

import datetime as dt
import json
import os

import numpy as np

from utils import OUTPUT_DIR, write_json

MODIFIED_Z_THRESHOLD = 3.5
BASELINE_WINDOW_DAYS = 21


def main() -> None:
    with open(os.path.join(OUTPUT_DIR, "temporal_cube.json"), encoding="utf-8") as f:
        raw_cube = json.load(f)
    dates_dim = raw_cube["dims"]["dates"]
    cols = {name: i for i, name in enumerate(raw_cube["columns"])}

    totals: dict[str, int] = {}
    for row in raw_cube["rows"]:
        d = dates_dim[row[cols["date_idx"]]]
        totals[d] = totals.get(d, 0) + row[cols["trips"]]

    dates = sorted(dt.date.fromisoformat(d) for d in totals)
    trips = np.array([totals[d.isoformat()] for d in dates], dtype=float)
    weekdays = np.array([d.weekday() for d in dates])
    n = len(dates)

    baseline = np.zeros(n)
    for i in range(n):
        mask = (weekdays == weekdays[i]) & (
            np.abs([(dates[j] - dates[i]).days for j in range(n)]) <= BASELINE_WINDOW_DAYS
        )
        baseline[i] = np.median(trips[mask])

    residual = trips - baseline
    residual_median = float(np.median(residual))
    mad = float(np.median(np.abs(residual - residual_median)))

    if mad == 0:
        modified_z = np.zeros(n)
    else:
        modified_z = 0.6745 * (residual - residual_median) / mad

    out = []
    for i in range(n):
        out.append(
            {
                "date": dates[i].isoformat(),
                "weekday": dates[i].isoweekday(),
                "trips": int(trips[i]),
                "weekday_median": round(float(baseline[i]), 1),
                "residual": round(float(residual[i]), 1),
                "modified_z": round(float(modified_z[i]), 2),
                "is_anomaly": bool(abs(modified_z[i]) > MODIFIED_Z_THRESHOLD),
                "direction": "spike" if modified_z[i] > 0 else "drop",
            }
        )

    write_json(
        {
            "method": "modified_z_score_local_weekday_baseline",
            "baseline_window_days": BASELINE_WINDOW_DAYS,
            "threshold": MODIFIED_Z_THRESHOLD,
            "days": out,
        },
        "anomalies.json",
    )
    n_anomalies = sum(1 for d in out if d["is_anomaly"])
    print(f"anomalies.json: {len(out)} days, {n_anomalies} flagged as anomalies")


if __name__ == "__main__":
    main()
