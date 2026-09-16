# UrbanPulse — Urban Mobility Intelligence Dashboard

**Live demo: https://surabhi3011.github.io/urbanpulse/**

A static, read-only analytics dashboard exploring NYC Citi Bike demand, station activity, routes,
temporal patterns, and simple anomaly/forecast analytics. Built with React, TypeScript, Vite,
Tailwind CSS, ECharts, and MapLibre GL JS, backed entirely by JSON pre-aggregated offline by a
Python (Polars) pipeline. No backend, database, or authentication.

## Highlights

- **Overview** — system-wide KPIs, demand trend, peak usage, top stations/routes, user-type split
- **Mobility Analysis** — daily/monthly trends, hour-of-day and day-of-week demand, an hour×weekday
  heatmap, weekday-vs-weekend and member-vs-casual comparisons
- **Spatial & Network Explorer** — an interactive MapLibre station map (demand-sized markers, OD
  route flow lines, a 3D elevation-by-demand toggle) plus station-level drill-down and comparison
  against the system average
- **Advanced Analytics** — a correlation scatter, demand distributions, anomaly detection (modified
  z-score against a local seasonal baseline), and a simple interpretable demand forecast
- **Methodology** — full data lineage: source, cleaning steps, aggregation grains, and known
  limitations, generated directly from the pipeline's own output (never hand-typed)
- CSV / multi-sheet Excel / print-to-PDF export and per-chart PNG export, all reflecting the
  active filters

## Project structure

```text
scripts/          Python data pipeline (raw CSV -> public/data/*.json)
DataRaw/           Raw source CSVs -- not committed (multi-GB); see "Data pipeline" below
data_build/        Intermediate build artifact (cleaned Parquet) -- not committed, regenerated
public/data/       Pre-aggregated JSON the frontend fetches at runtime (committed --
                   the deployed site needs these and they're only ~2MB total)
src/
  components/      layout, filters, kpis, charts, maps, exports, common
  pages/           Overview, MobilityAnalysis, NetworkExplorer, AdvancedAnalytics, Methodology
  services/        aggregate.ts (the single filter+aggregation layer), dataLoader.ts, exportService.ts
  context/         filterStore.ts (Zustand global filters), DataContext.tsx (data loading)
  types/           TypeScript types mirroring the JSON files
```

## Data pipeline

Source dataset: [NYC Citi Bike System Data](https://citibikenyc.com/system-data) for
Jan 1 - Jun 30, 2026 (~19.9M raw trip records). See the in-app **Methodology & Data Sources**
page for full cleaning steps, aggregation grains, and known limitations.

Setup (Python 3.12+):

```bash
cd scripts
pip install -r requirements.txt
```

Place raw monthly CSVs under `DataRaw/` (any nested folder structure is fine; the pipeline
recursively globs for `*.csv`), then run the full pipeline:

```bash
python run_all.py
```

This regenerates every file in `public/data/`. Individual stages (`01_clean_trips.py` through
`08_duration_histogram.py`) can also be run standalone during development — each later stage
reads the previous stage's output.

## Frontend development

```bash
npm install
npm run dev
```

The dev server serves `public/data/*.json` directly, so the pipeline must have been run at least
once first.

## Production build

```bash
npm run build
npm run preview   # serve dist/ locally to sanity-check before deploying
```

`vite.config.ts` uses `base: './'` and the app uses a `HashRouter`, so the built `dist/` folder
works when dropped into a GitHub Pages project site (or any static host) without editing paths
for a specific repo name.

## Deploying to GitHub Pages

Deployment is automated via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): every
push to `main` runs `npm ci && npm run build` and publishes `dist/` straight to GitHub Pages using
`actions/upload-pages-artifact` + `actions/deploy-pages` — no `gh-pages` branch, no manual steps.

To enable it on a fork or a fresh clone:

1. Push the repository to GitHub.
2. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push (or re-run) the workflow — the deployed URL appears in the workflow run summary and under
   Settings → Pages.

No environment variables, API keys, or server configuration are required — every data file the
app needs is already committed in `public/data/`.

## Notes

- Map basemaps are CARTO's free Positron/Dark Matter vector styles (no API key required).
- `xlsx` (SheetJS) currently carries a known upstream advisory for parsing untrusted files; this
  app only *writes* `.xlsx` files for export and never parses user-supplied spreadsheets, so the
  advisory's attack surface doesn't apply here.
