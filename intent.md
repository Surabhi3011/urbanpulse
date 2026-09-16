# Project Intent: Urban Mobility Intelligence Dashboard

## 1. Project Overview

Build a professional, responsive, read-only analytics dashboard named **UrbanPulse**.

The dashboard will analyze a smaller, curated urban mobility dataset, such as bike-share trips, public transportation usage, or shared mobility activity. The application should demonstrate practical data analytics, spatial analysis, interactive visualization, and applied AI-assisted development.

This is a portfolio-quality project intended to showcase:

- Frontend engineering
- Data visualization
- Data analytics
- Spatial and network analysis
- Interactive dashboard design
- Static application architecture
- Professional reporting and export functionality
- Thoughtful use of 3D visualization

The application should be implemented as a static frontend. It must not require a backend, database, authentication, user profiles, or persistent user-generated records.

---

## 2. Primary Objective

Create an interactive analytics experience where users can explore mobility demand, station activity, route patterns, temporal behavior, geographic distribution, anomalies, and simple forecasts through a unified set of filters and visualizations.

The dashboard should feel like a polished business intelligence or urban planning analytics product rather than a generic chart gallery.

The application must be:

- Responsive
- Fast
- Visually consistent
- Accessible
- Easy to navigate
- Data-driven
- Modular
- Maintainable
- Suitable for deployment on Vercel or GitHub Pages

---

## 3. Explicitly Out of Scope

Do not build the following:

- User registration or login
- Authentication
- User profiles
- Supabase
- Firebase
- Backend APIs
- Server-side database
- Data entry forms
- CRUD functionality
- Persistent user-created records
- Admin dashboard
- Operations management
- Live vehicle tracking
- Real-time data ingestion
- Payment functionality
- Subscription functionality
- Chat functionality
- Complex machine-learning infrastructure
- Unnecessary enterprise architecture

The application is a static, read-only analytics product.

---

## 4. Recommended Technology Stack

Use the following technologies unless there is a strong technical reason to make a change.

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Visualization

- Apache ECharts for charts
- MapLibre GL JS for interactive maps
- Three.js only where actual 3D spatial or network visualization adds analytical value

### Data Processing

Use Python for preprocessing and analysis before the data is bundled into the application.

Recommended Python libraries:

- Pandas or Polars
- NumPy
- Scikit-learn only if needed for simple analytics
- GeoPandas only if geographic processing requires it

### Data Format

Use:

- CSV or Excel as source/preparation formats
- JSON as the primary browser runtime format

Avoid loading a large raw dataset directly into the browser. Preaggregate and optimize the data during preprocessing.

### Export

Use:

- SheetJS for Excel export
- Native CSV generation or a lightweight CSV utility
- Browser print styles and/or a client-side PDF library for PDF reports
- ECharts export functionality for chart image export where useful

---

## 5. Application Architecture

The architecture should follow this pipeline:

```text
Open Dataset
    ↓
Python Data Cleaning and Preprocessing
    ↓
Processed JSON / CSV Assets
    ↓
React Static Frontend
    ↓
Interactive Filters
    ↓
KPIs, Charts, Maps, Analytics, Exports
```

The frontend should load data from static files stored in the project repository.

Example:

```text
public/
└── data/
    ├── stations.json
    ├── trips_daily.json
    ├── trips_hourly.json
    ├── station_metrics.json
    ├── route_metrics.json
    ├── temporal_metrics.json
    ├── anomalies.json
    └── forecasts.json
```

The application must work after deployment without requiring local file paths, a Python server, a Node.js backend, or a database.

---

## 6. Dataset Direction

Use a manageable open dataset related to urban mobility.

Preferred options include:

- Bike-share trip data
- Public transportation ridership data
- GTFS-based transit data
- Shared mobility station and trip data

A bike-share dataset is preferred because it can support:

- Station-level demand
- Origin-destination analysis
- Trip duration analysis
- Member versus casual-user analysis
- Hourly and daily demand patterns
- Geographic clustering
- Route patterns
- Station balancing analysis
- Demand forecasting
- Anomaly detection
- Network visualization

Use a smaller representative dataset rather than attempting to load millions of raw records into the browser.

The dataset and its limitations must be documented clearly in the application.

Do not invent metrics that the dataset cannot support.

---

## 7. Main Application Pages

Create the following pages or primary navigation sections.

### 7.1 Overview

**Purpose:** Provide a high-level summary of the mobility system.

Include:

- KPI cards
- Overall demand trend
- Peak usage summary
- Top stations or routes
- User-type distribution, if available
- Geographic activity preview
- Key analytical observations
- Current filter summary

Suggested KPIs:

- Total trips
- Average daily trips
- Average trip duration
- Number of active stations
- Peak demand hour
- Most-used station
- Most-used route
- Member versus casual share, if available

Only show KPIs supported by the dataset.

### 7.2 Mobility Analysis

**Purpose:** Explore demand patterns over time and across categories.

Include:

- Daily or weekly demand trend
- Monthly demand trend, if sufficient date coverage exists
- Hour-of-day demand
- Weekday versus weekend comparison
- Day-of-week analysis
- Seasonal comparison, if the dataset spans multiple seasons
- Trip-duration distribution
- User-type comparison
- Demand heatmap

Recommended visualizations:

- Line chart
- Area chart
- Bar chart
- Stacked bar chart
- Calendar heatmap
- Hour-by-weekday heatmap
- Box plot or histogram
- Distribution chart

### 7.3 Spatial and Network Explorer

**Purpose:** Explore the geographic and network structure of the mobility system.

Include:

- Interactive station map
- Station demand ranking
- Origin-destination route patterns
- Geographic clustering
- Station-level filtering
- Route-level filtering
- Spatial density visualization
- Station activity details
- Optional flow lines between stations

Map capabilities should include:

- Pan and zoom
- Station markers
- Marker sizing based on demand
- Marker color based on a meaningful metric
- Hover or click details
- Filtering by station, area, demand level, or user type
- Optional route flow visualization
- Optional clustering for dense station areas

Do not use a decorative map. The map must support actual analysis.

### 7.4 Advanced Analytics

**Purpose:** Demonstrate analytical depth beyond basic descriptive charts.

Include the following where supported by the data.

**Correlation Analysis**

Analyze relationships such as:

- Trip volume versus average trip duration
- Station demand versus station connectivity
- Demand versus time-related variables
- Demand versus geographic or network characteristics

Use a scatter plot or correlation matrix.

Clearly label correlation as association, not causation.

**Demand Distribution**

Show:

- Distribution of station demand
- Distribution of trip duration
- Distribution of daily trips
- High-demand and low-demand groups
- Percentile-based comparisons

Use histograms, box plots, or ranked distributions.

**Anomaly Detection**

Identify unusual observations such as:

- Unexpected demand spikes
- Unusually low-demand days
- Abnormal station activity
- Unusual trip-duration patterns

Use a transparent, simple method such as:

- Z-score
- Interquartile range
- Rolling mean deviation
- Seasonal baseline comparison

Explain the method in the UI or methodology section.

Do not present anomalies as confirmed real-world incidents.

**Simple Forecasting**

Provide a basic forecast for future demand using an interpretable method.

Possible methods:

- Moving average
- Exponential smoothing
- Linear trend
- Seasonal baseline
- Simple regression

The forecast should include:

- Historical values
- Forecast values
- Forecast horizon
- Clear distinction between actual and predicted data
- Methodology note
- Limitations

Do not present the forecast as highly accurate or production-grade.

### 7.5 Methodology and Data Sources

Include a page or expandable section describing:

- Dataset source
- Dataset date range
- Geographic coverage
- Data fields used
- Data cleaning steps
- Aggregation logic
- Metric definitions
- Anomaly detection method
- Forecasting method
- Known limitations
- Static application architecture

This section is important for portfolio credibility.

---

## 8. Global Filtering System

All relevant dashboard components must respond consistently to shared filters.

Create a centralized filter state rather than implementing unrelated filters inside individual charts.

Recommended filters:

- Date range
- Month or season, if supported
- Day type: all days, weekdays, weekends
- Hour range
- User type
- Station
- Origin station
- Destination station
- Route
- Demand category
- Geographic area
- Metric selection where appropriate

Requirements:

- Filters should update all compatible KPIs, charts, maps, and analytics.
- The active filter state should be visible.
- Users should be able to clear filters.
- Filters should have sensible defaults.
- Components that cannot respond to a filter should clearly indicate that the filter does not apply.
- Avoid inconsistent calculations between components.
- Avoid duplicating filter logic across pages.
- Use a centralized data-filtering and aggregation layer.

Suggested conceptual flow:

```text
Raw Processed Data
    ↓
Global Filter State
    ↓
Filtered Dataset
    ↓
Derived Metrics
    ↓
Charts, KPIs, Maps, Tables, Exports
```

---

## 9. Period Comparison Features

The dashboard must support comparisons where the dataset allows them.

Possible comparison modes:

- Current period versus previous period
- Weekday versus weekend
- One month versus another month
- One season versus another season
- Selected station versus system average
- Selected route versus system average
- Current filtered segment versus all-data baseline

Comparison outputs may include:

- Absolute difference
- Percentage difference
- Direction indicator
- Side-by-side charts
- Overlaid trend lines
- Comparison summary text

Do not show misleading percentage changes when the baseline is zero or unavailable.

---

## 10. KPI Design

KPI cards should be concise and analytical.

Each KPI should include:

- Metric name
- Current value
- Optional comparison value
- Optional percentage change
- Short contextual label
- Clear unit formatting

Examples:

- Total Trips
- Average Daily Trips
- Average Trip Duration
- Active Stations
- Peak Hour
- Top Station
- Weekend Share
- Average Trips per Station

Avoid excessive KPI cards. Prioritize the most useful metrics.

Do not use fake values or placeholder statistics in the final application.

---

## 11. Visualization Guidelines

Use charts based on analytical purpose.

**Recommended Chart Types**

| Analytical Question | Recommended Visualization |
|---|---|
| How does demand change over time? | Line or area chart |
| Which stations are busiest? | Horizontal bar chart |
| What are the busiest hours? | Bar chart |
| How does demand vary by weekday and hour? | Heatmap |
| How are users distributed? | Donut or stacked bar |
| How are trip durations distributed? | Histogram or box plot |
| Are two metrics related? | Scatter plot |
| Which locations have the highest demand? | Map |
| How do routes connect? | Network or flow visualization |
| Which observations are unusual? | Highlighted time series or scatter plot |
| What is expected next? | Actual-versus-forecast line chart |

**Chart Requirements**

- Use consistent typography and spacing.
- Use restrained colors.
- Avoid unnecessary gradients.
- Avoid 3D charts for ordinary statistical data.
- Include meaningful axis labels.
- Include tooltips with units.
- Handle empty states gracefully.
- Handle missing data gracefully.
- Make charts responsive.
- Avoid overcrowded legends.
- Ensure dark and light themes remain readable if both are implemented.

---

## 12. 3D Explorer Requirements

Include a dedicated 3D visualization only if it provides analytical value.

The 3D view should represent one or more of the following:

- Station locations in a 3D spatial environment
- Station demand represented by vertical bars or elevation
- Origin-destination network connections
- Route intensity represented by line thickness or height
- Geographic clusters
- Temporal playback of demand across the network
- Spatial relationship between stations and demand

The 3D explorer must not be merely decorative.

Recommended approach:

- Use MapLibre's terrain or pitch capabilities where sufficient.
- Use Three.js for a dedicated 3D network or station explorer if necessary.
- Keep the 3D view separate from ordinary charts.
- Provide camera controls or simple navigation.
- Provide a legend explaining the visual encoding.
- Allow users to select or inspect stations or routes.
- Ensure the view remains usable on smaller screens.
- Provide a fallback or simplified 2D representation if WebGL is unavailable.

Avoid:

- Making every chart 3D
- Excessive animation
- Unnecessary visual effects
- 3D elements that do not encode meaningful data
- Performance-heavy rendering for a small analytical benefit

---

## 13. Export Requirements

Exports must reflect the current filter state.

**CSV Export**

Allow users to export the currently filtered data or a relevant summary table.

The export should include:

- Applied filters
- Selected metric or view
- Relevant columns
- Human-readable column names where practical

**Excel Export**

Use SheetJS or an equivalent client-side library.

The workbook may contain separate sheets such as:

- Filter Summary
- KPI Summary
- Daily Metrics
- Station Metrics
- Route Metrics
- Anomalies
- Forecast

Only include sheets relevant to the available data.

**PDF Report**

Provide a polished PDF or print-ready report containing:

- Dashboard title
- Report generation date
- Applied filters
- KPI summary
- Selected charts
- Key findings
- Methodology note
- Data source note

The PDF should be designed for readability rather than being a raw browser screenshot.

If direct PDF generation becomes unnecessarily complex, implement a high-quality print layout that users can save as PDF through the browser.

**Chart Image Export**

Where practical, allow individual charts to be exported as PNG or SVG.

---

## 14. UI and UX Direction

The design should be:

- Minimalist
- Spacious
- Professional
- Data-focused
- Modern
- Easy to scan
- Suitable for a portfolio presentation

Recommended layout:

```text
Application Shell
├── Sidebar or Top Navigation
├── Page Header
├── Global Filter Bar
├── KPI Row
├── Main Visualization Grid
├── Analytical Insights
└── Footer / Methodology Link
```

Design principles:

- Use generous spacing.
- Establish a clear visual hierarchy.
- Avoid excessive borders and shadows.
- Use cards only where grouping is useful.
- Keep labels concise.
- Use consistent chart heights.
- Make important findings visually prominent.
- Avoid cluttering the dashboard with too many controls.
- Use clear empty, loading, and error states.
- Ensure the dashboard works on desktop, tablet, and mobile.

The dashboard should look like a real analytics product, not a template filled with unrelated charts.

---

## 15. Suggested Project Structure

Use a structure similar to the following:

```text
urbanpulse/
├── public/
│   └── data/
│       ├── stations.json
│       ├── trips_daily.json
│       ├── trips_hourly.json
│       ├── station_metrics.json
│       ├── route_metrics.json
│       ├── anomalies.json
│       └── forecasts.json
│
├── scripts/
│   ├── prepare_data.py
│   ├── calculate_metrics.py
│   ├── detect_anomalies.py
│   └── generate_forecast.py
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── filters/
│   │   ├── kpis/
│   │   ├── charts/
│   │   ├── maps/
│   │   ├── analytics/
│   │   ├── exports/
│   │   └── common/
│   │
│   ├── pages/
│   │   ├── Overview.tsx
│   │   ├── MobilityAnalysis.tsx
│   │   ├── NetworkExplorer.tsx
│   │   ├── AdvancedAnalytics.tsx
│   │   └── Methodology.tsx
│   │
│   ├── hooks/
│   ├── context/
│   ├── types/
│   ├── utils/
│   ├── services/
│   ├── data/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── intent.md
```

This structure can be simplified if the project is small, but maintain clear separation between:

- UI components
- Data loading
- Filtering
- Metric calculations
- Visualization configuration
- Export logic
- Type definitions

---

## 16. Data Processing Requirements

Before building the frontend:

- Identify a suitable open dataset.
- Download and inspect the data.
- Document the source and license.
- Select a manageable date range and geographic scope.
- Clean invalid or incomplete records.
- Standardize column names.
- Parse timestamps consistently.
- Calculate trip duration where possible.
- Remove or flag invalid durations.
- Generate station-level metrics.
- Generate route-level metrics.
- Generate daily and hourly aggregates.
- Generate weekday/weekend metrics.
- Generate user-type metrics where available.
- Generate anomaly results.
- Generate simple forecast results.
- Export optimized JSON files for the frontend.

Do not ship unnecessary raw data if processed aggregates are sufficient.

---

## 17. Performance Requirements

The application should remain responsive.

Requirements:

- Prefer precomputed aggregates for common views.
- Avoid recalculating expensive metrics on every render.
- Memoize derived filtered data where appropriate.
- Lazy-load heavy 3D functionality if possible.
- Avoid rendering thousands of map markers simultaneously without clustering or aggregation.
- Use pagination or virtualization for large tables.
- Keep chart animations subtle and short.
- Avoid unnecessary dependencies.
- Avoid loading large raw files when smaller aggregated files will work.
- Display loading states while data files are being fetched.

---

## 18. Error and Empty States

Implement clear handling for:

- Data loading failure
- Missing data files
- Empty filter results
- Unsupported filter combinations
- Missing geographic coordinates
- Missing metric values
- WebGL or 3D rendering failure
- Export failure
- Invalid date ranges

Example empty-state message:

> No records match the selected filters. Try expanding the date range or clearing one or more filters.

Do not leave blank chart containers without explanation.

---

## 19. Accessibility Requirements

Follow basic accessibility practices:

- Use semantic HTML.
- Provide labels for filters.
- Ensure keyboard navigation works.
- Maintain sufficient color contrast.
- Do not rely on color alone to communicate meaning.
- Provide text alternatives or summaries for important charts.
- Use accessible buttons and controls.
- Ensure tooltips are not the only way to access essential information.
- Maintain visible focus states.
- Avoid motion that cannot be paused or disabled.

---

## 20. Development Workflow

Follow this implementation order.

**Phase 1: Project Setup**

- Initialize Vite React TypeScript project.
- Configure Tailwind CSS.
- Install charting, mapping, and export dependencies.
- Establish the application shell.
- Set up routing or page navigation.
- Create shared types and utilities.

**Phase 2: Data Preparation**

- Select and document the dataset.
- Build Python preprocessing scripts.
- Generate optimized JSON files.
- Validate the processed data.
- Add a data dictionary.

**Phase 3: Core Dashboard**

- Implement data loading.
- Implement global filter state.
- Implement KPI calculations.
- Build Overview page.
- Build primary charts.
- Add responsive layout.

**Phase 4: Mobility and Spatial Analysis**

- Build Mobility Analysis page.
- Build MapLibre station map.
- Add station and route analysis.
- Add spatial filtering.
- Add network explorer.

**Phase 5: Advanced Analytics**

- Add correlation analysis.
- Add distributions.
- Add anomaly detection results.
- Add simple forecasting.
- Add explanatory methodology notes.

**Phase 6: 3D Explorer**

- Implement the dedicated 3D view.
- Connect it to filtered data.
- Add meaningful spatial/network encodings.
- Add fallback behavior.

**Phase 7: Exports and Polish**

- Add CSV export.
- Add Excel export.
- Add PDF or print report.
- Add chart image export where practical.
- Add loading and empty states.
- Test responsive behavior.
- Test filter consistency.
- Optimize performance.

**Phase 8: Deployment**

- Build the production application.
- Verify static asset paths.
- Test deployment on Vercel or GitHub Pages.
- Verify that all JSON files load correctly after deployment.
- Add setup and deployment instructions to README.md.

---

## 21. Quality Requirements

Before considering the project complete, verify the following.

**Functionality**

- All pages load correctly.
- Static data loads after deployment.
- Global filters work consistently.
- KPIs update correctly.
- Charts update correctly.
- Maps update correctly.
- Period comparisons are accurate.
- Anomalies and forecasts are clearly labeled.
- Exports reflect active filters.
- 3D explorer uses real data.
- Empty states work.

**Visual Quality**

- Layout is responsive.
- Typography is consistent.
- Charts are readable.
- No overlapping elements.
- No excessive visual clutter.
- Navigation is intuitive.
- Dark/light behavior, if implemented, is consistent.
- Mobile layout is usable.

**Technical Quality**

- TypeScript types are meaningful.
- Components are modular.
- No unnecessary backend exists.
- No authentication exists.
- No Supabase is used.
- No hardcoded fake analytics are used.
- No broken asset paths exist.
- No console errors remain.
- Build completes successfully.

---

## 22. Data Integrity Rules

The application must prioritize analytical honesty.

- Never fabricate data.
- Never fabricate dataset sources.
- Never label estimates as measured facts.
- Clearly distinguish actual values from forecasts.
- Clearly explain assumptions.
- Do not imply causation from correlation.
- Do not overstate anomaly detection results.
- Do not display unsupported KPIs.
- Handle missing values transparently.
- Use appropriate units and rounding.
- Avoid misleading chart scales.
- Include the dataset date range and limitations.

---

## 23. Expected Final Deliverables

The final project should include:

- A complete responsive React dashboard.
- A static data-loading architecture.
- Processed sample dataset files.
- Python preprocessing scripts.
- Overview dashboard.
- Mobility analysis page.
- Spatial/network explorer.
- Advanced analytics section.
- Dedicated 3D explorer, where technically justified.
- Cross-filtering across compatible components.
- Period comparison functionality.
- CSV export.
- Excel export.
- PDF or print-ready report.
- Methodology and data source documentation.
- README with setup, processing, and deployment instructions.
- No backend, database, authentication, or Supabase dependency.

---

## 24. Implementation Principle

Prioritize a smaller, complete, polished, and analytically coherent product over a large application with unfinished features.

Every feature should serve the central purpose:

Help users understand urban mobility demand, spatial behavior, temporal patterns, and network performance through interactive, explainable analytics.
