import { Boxes, Clock, ListOrdered, Route, TrendingUp, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/common/EmptyState";
import { FilterBar } from "../components/filters/FilterBar";
import { StationMap, type MapStation } from "../components/maps/StationMap";
import { useUrbanPulseData } from "../context/DataContext";
import { useFilterStore } from "../context/filterStore";
import {
  compareStationVsSystemAverage,
  filterRoutes,
  filterStationMonthly,
  stationActivityFromMonthly,
} from "../services/aggregate";
import { formatInt, formatMinutes, formatPct } from "../utils/format";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export default function NetworkExplorer() {
  const { stations, stationMonthly, routes } = useUrbanPulseData();
  const filters = useFilterStore();
  const [show3D, setShow3D] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const webglOk = useMemo(supportsWebGL, []);

  const filteredMonthly = useMemo(
    () => filterStationMonthly(stationMonthly, filters),
    [stationMonthly, filters]
  );
  const activityMap = useMemo(() => stationActivityFromMonthly(filteredMonthly), [filteredMonthly]);

  const mapStations: MapStation[] = useMemo(
    () =>
      stations.map((s) => ({
        ...s,
        filteredActivity: activityMap.get(s.station_id)?.total ?? 0,
      })),
    [stations, activityMap]
  );

  const rankedStations = useMemo(
    () => [...mapStations].sort((a, b) => b.filteredActivity - a.filteredActivity).slice(0, 15),
    [mapStations]
  );

  const filteredRoutes = useMemo(() => filterRoutes(routes, filters), [routes, filters]);

  const selectedStation = filters.stationId
    ? stations.find((s) => s.station_id === filters.stationId) ?? null
    : null;
  const stationComparison = filters.stationId
    ? compareStationVsSystemAverage(stations, filters.stationId)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Spatial &amp; Network Explorer
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Station demand, geographic distribution, and origin-destination route patterns. Station
          activity below reflects the selected date range at month granularity and the user-type
          filter; hour-range and day-type filters don't narrow this view further (see{" "}
          <span className="italic">Methodology</span>).
        </p>
      </div>

      <FilterBar scope="spatial" />

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input type="checkbox" checked={show3D} onChange={(e) => setShow3D(e.target.checked)} />
          <Boxes aria-hidden="true" size={15} />
          3D view (station elevation by demand)
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={showRoutes}
            onChange={(e) => setShowRoutes(e.target.checked)}
          />
          <Route aria-hidden="true" size={15} />
          Show route flow lines
        </label>
        <span className="text-xs text-[var(--color-text-muted)]">
          {filteredRoutes.length} of {routes.length} top routes shown
          {filters.stationId ? " (filtered to selected station)" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="h-[480px] overflow-hidden rounded-xl border border-[var(--color-border)]">
          {webglOk ? (
            <StationMap
              stations={mapStations}
              routes={showRoutes ? filteredRoutes : []}
              selectedStationId={filters.stationId}
              onSelectStation={(id) => filters.setStation(id)}
              show3D={show3D}
              showRoutes={showRoutes}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState
                title="3D/interactive map unavailable"
                message="Your browser doesn't support WebGL. Showing the station ranking table instead — see the list on the right."
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
              <ListOrdered aria-hidden="true" size={15} className="text-[var(--color-text-muted)]" />
              Station Demand Ranking
            </h3>
            <ol className="flex max-h-[380px] flex-col gap-2 overflow-y-auto text-sm">
              {rankedStations.map((s, i) => (
                <li key={s.station_id}>
                  <button
                    type="button"
                    onClick={() => filters.setStation(s.station_id === filters.stationId ? null : s.station_id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left hover:bg-[var(--color-surface-subtle)] ${
                      filters.stationId === s.station_id ? "bg-[var(--color-accent-subtle)]" : ""
                    }`}
                  >
                    <span className="truncate text-[var(--color-text-secondary)]">
                      {i + 1}. {s.name}
                    </span>
                    <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                      {formatInt(s.filteredActivity)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {selectedStation && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-sm">
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
                {selectedStation.name}
              </h3>
              <dl className="flex flex-col gap-1 text-[var(--color-text-secondary)]">
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5">
                    <TrendingUp aria-hidden="true" size={13} />
                    Starts / Ends
                  </dt>
                  <dd className="tabular-nums text-[var(--color-text-primary)]">
                    {formatInt(selectedStation.starts_count)} / {formatInt(selectedStation.ends_count)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5">
                    <Clock aria-hidden="true" size={13} />
                    Avg start duration
                  </dt>
                  <dd className="tabular-nums text-[var(--color-text-primary)]">
                    {formatMinutes(selectedStation.avg_start_duration_min)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5">
                    <Users aria-hidden="true" size={13} />
                    Member share
                  </dt>
                  <dd className="tabular-nums text-[var(--color-text-primary)]">
                    {formatPct(selectedStation.member_share_starts)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5">
                    <Route aria-hidden="true" size={13} />
                    Top destination
                  </dt>
                  <dd className="truncate text-[var(--color-text-primary)]">
                    {selectedStation.top_destination_name ?? "—"}
                  </dd>
                </div>
                {stationComparison && (
                  <div className="flex justify-between">
                    <dt>vs. system average</dt>
                    <dd
                      className={`tabular-nums font-medium ${
                        stationComparison.absoluteDiff >= 0
                          ? "text-[var(--color-positive)]"
                          : "text-[var(--color-negative)]"
                      }`}
                    >
                      {stationComparison.pctDiff !== null
                        ? `${stationComparison.pctDiff >= 0 ? "+" : ""}${stationComparison.pctDiff.toFixed(0)}%`
                        : "—"}
                    </dd>
                  </div>
                )}
              </dl>
              <button
                type="button"
                onClick={() => filters.setStation(null)}
                className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                <X aria-hidden="true" size={12} />
                Clear station selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
