"""
Stage 6: build forecasts.json -- a simple, interpretable demand forecast.

Method: linear trend over the trailing 42 days, combined with a
day-of-week seasonal index (each weekday's ratio to its own recent
average) computed over the same window. This is a transparent,
explainable method appropriate for a portfolio project -- not a
production-grade forecasting model. See Methodology page for the
explicit limitations shown alongside the chart.
"""
from __future__ import annotations

import datetime as dt
import json
import os

import numpy as np

from utils import OUTPUT_DIR, write_json

TRAILING_WINDOW_DAYS = 42
FORECAST_HORIZON_DAYS = 14


def main() -> None:
    with open(os.path.join(OUTPUT_DIR, "anomalies.json"), encoding="utf-8") as f:
        daily = json.load(f)["days"]

    daily_sorted = sorted(daily, key=lambda d: d["date"])
    dates = [dt.date.fromisoformat(d["date"]) for d in daily_sorted]
    trips = np.array([d["trips"] for d in daily_sorted], dtype=float)

    window = trips[-TRAILING_WINDOW_DAYS:]
    window_dates = dates[-TRAILING_WINDOW_DAYS:]
    x = np.arange(len(window))
    slope, intercept = np.polyfit(x, window, 1)

    weekday_ratio = {}
    trend_at_window = slope * x + intercept
    for wd in range(7):
        idx = [i for i, d in enumerate(window_dates) if d.weekday() == wd]
        if idx:
            ratios = [window[i] / trend_at_window[i] for i in idx if trend_at_window[i] > 0]
            weekday_ratio[wd] = float(np.mean(ratios)) if ratios else 1.0
        else:
            weekday_ratio[wd] = 1.0

    last_date = dates[-1]
    last_x = len(window) - 1
    forecast = []
    for h in range(1, FORECAST_HORIZON_DAYS + 1):
        f_date = last_date + dt.timedelta(days=h)
        trend_val = slope * (last_x + h) + intercept
        seasonal = weekday_ratio.get(f_date.weekday(), 1.0)
        pred = max(0.0, trend_val * seasonal)
        forecast.append({"date": f_date.isoformat(), "forecast_trips": round(pred, 0)})

    historical = [
        {"date": d["date"], "trips": d["trips"]} for d in daily_sorted[-(TRAILING_WINDOW_DAYS):]
    ]

    write_json(
        {
            "method": "linear_trend_plus_weekday_seasonality",
            "trailing_window_days": TRAILING_WINDOW_DAYS,
            "horizon_days": FORECAST_HORIZON_DAYS,
            "trend_slope_per_day": round(float(slope), 2),
            "historical": historical,
            "forecast": forecast,
        },
        "forecasts.json",
    )
    print(f"forecasts.json: {len(historical)} historical days, {len(forecast)} forecast days")
    print(f"trend slope: {slope:.2f} trips/day over trailing {TRAILING_WINDOW_DAYS}d window")


if __name__ == "__main__":
    main()
