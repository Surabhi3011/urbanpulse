# UrbanPulse: Urban Mobility Intelligence Dashboard

**Live demo: https://surabhi3011.github.io/urbanpulse/**

UrbanPulse is an interactive analytics dashboard for NYC Citi Bike. It explores about 19.9 million trips from January to June 2026 to show where and when people ride, which stations and routes are busiest, and when demand behaves unusually.

The site is fully static. A Python pipeline pre-aggregates the raw trip data into small JSON files, and the browser does the rest. There is no backend, database or login.

## Features

- **Overview:** system-wide KPIs, demand trend, peak hours, top stations and routes, member vs casual split.
- **Mobility Analysis:** daily and monthly trends, hour-of-day and day-of-week demand, an hour × weekday heatmap, weekday vs weekend and member vs casual comparisons.
- **Spatial & Network Explorer:** an interactive station map with demand-sized markers, origin–destination flow lines and a 3D view, plus station drill-down and comparison against the system average.
- **Advanced Analytics:** correlation scatter, demand distributions, anomaly detection (modified z-score against a seasonal baseline) and a simple, interpretable demand forecast.
- **Methodology & Data Sources:** data lineage, cleaning steps, aggregation levels and known limitations, generated from the pipeline's own output.
- **Exports:** CSV, multi-sheet Excel, print-to-PDF and per-chart PNG, all reflecting the active filters.

## Data

Source: [NYC Citi Bike System Data](https://citibikenyc.com/system-data), 1 January to 30 June 2026 (about 19.9M raw trip records). The in-app **Methodology** page documents how the data was cleaned and aggregated, and its limitations.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, ECharts, MapLibre GL JS, Zustand
- **Data pipeline:** Python with Polars
- **Hosting:** GitHub Pages, deployed by GitHub Actions
- **Basemaps:** CARTO Positron and Dark Matter (free, no API key)

## Project structure

```text
scripts/          Python data pipeline (raw CSV -> public/data/*.json)
public/data/      Pre-aggregated JSON loaded by the app (~2 MB in total)
src/
  components/     Layout, filters, KPIs, charts, maps, exports
  pages/          Overview, MobilityAnalysis, NetworkExplorer, AdvancedAnalytics, Methodology
  services/       Filtering and aggregation, data loading, exports
  context/        Global filter state and data loading
  types/          TypeScript types for the JSON files
```

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev
```

The processed data is already committed in `public/data/`, so the app runs without rebuilding it.

To build for production:

```bash
npm run build
npm run preview   # serve dist/ locally
```

The build uses relative paths and hash-based routing, so `dist/` works on any static host without configuration.

## Rebuild the data

Requires Python 3.12+.

```bash
cd scripts
pip install -r requirements.txt
```

Download the monthly Citi Bike trip CSVs into a `DataRaw/` folder at the repository root (any folder structure works; the pipeline finds every `*.csv`). Then run:

```bash
python run_all.py
```

This regenerates every file in `public/data/`. Each stage (`01_clean_trips.py` to `08_duration_histogram.py`) can also run on its own; each reads the output of the one before. The raw CSVs and the intermediate `data_build/` folder are not committed because of their size.

## Deploy your own copy

Every push to `main` builds the app and publishes it to GitHub Pages through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Fork the repository.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` or re-run the workflow. The site URL appears in the workflow summary.

No environment variables or API keys are needed.

## Security note

The Excel export uses SheetJS (`xlsx`), which has a known advisory about parsing untrusted files. UrbanPulse only writes spreadsheets and never reads uploaded ones, so the advisory does not apply.

## Licence

Code is released under the [MIT Licence](LICENSE). Trip data © Citi Bike / Lyft, used under the [NYCBS Data Use Policy](https://citibikenyc.com/data-sharing-policy).

---

Built by Surabhi Gupta.
