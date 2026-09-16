import { useMemo } from "react";
import { useUrbanPulseData } from "../../context/DataContext";
import { isFilterActive, useFilterStore } from "../../context/filterStore";
import type { DayType } from "../../types/filters";
import { DatePicker } from "./DatePicker";
import { StationSelect } from "./StationSelect";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function FilterBar({ scope = "global" }: { scope?: "global" | "spatial" }) {
  const { meta, stations, temporalCube } = useUrbanPulseData();
  const filters = useFilterStore();

  const bikeTypes = useMemo(
    () => [...new Set(temporalCube.map((r) => r.bikeType))].sort(),
    [temporalCube]
  );
  const sortedStations = useMemo(
    () => [...stations].sort((a, b) => a.demand_rank - b.demand_rank),
    [stations]
  );

  const defaults = meta.dataset.date_range;
  const active = isFilterActive(filters, { startDate: defaults.start, endDate: defaults.end });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="flex flex-wrap items-end gap-4">
        <DatePicker
          label="Start date"
          value={filters.startDate}
          min={defaults.start}
          max={filters.endDate}
          onChange={(date) => filters.setDateRange(date, filters.endDate)}
        />
        <DatePicker
          label="End date"
          value={filters.endDate}
          min={filters.startDate}
          max={defaults.end}
          onChange={(date) => filters.setDateRange(filters.startDate, date)}
        />
        <Field label="Day type">
          <select
            value={filters.dayType}
            onChange={(e) => filters.setDayType(e.target.value as DayType)}
            className={inputClass}
          >
            <option value="all">All days</option>
            <option value="weekday">Weekdays</option>
            <option value="weekend">Weekends</option>
          </select>
        </Field>
        <Field label="Hour range">
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Start hour"
              value={filters.hourStart}
              onChange={(e) => filters.setHourRange(Number(e.target.value), filters.hourEnd)}
              className={inputClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h} disabled={h > filters.hourEnd}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
            <span className="text-xs text-[var(--color-text-muted)]">to</span>
            <select
              aria-label="End hour"
              value={filters.hourEnd}
              onChange={(e) => filters.setHourRange(filters.hourStart, Number(e.target.value))}
              className={inputClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h} disabled={h < filters.hourStart}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="User type">
          <select
            value={filters.userType ?? ""}
            onChange={(e) => filters.setUserType((e.target.value || null) as "member" | "casual" | null)}
            className={inputClass}
          >
            <option value="">All users</option>
            <option value="member">Member</option>
            <option value="casual">Casual</option>
          </select>
        </Field>
        <Field label="Bike type">
          <select
            value={filters.bikeType ?? ""}
            onChange={(e) => filters.setBikeType(e.target.value || null)}
            className={inputClass}
          >
            <option value="">All bikes</option>
            {bikeTypes.map((b) => (
              <option key={b} value={b}>
                {b.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        {scope === "spatial" && (
          <StationSelect
            stations={sortedStations}
            value={filters.stationId}
            onChange={filters.setStation}
          />
        )}
        <button
          type="button"
          onClick={() => filters.resetFilters({ startDate: defaults.start, endDate: defaults.end })}
          disabled={!active}
          className="ml-auto rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>
      {active && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          <span className="font-medium text-[var(--color-text-primary)]">Active filters: </span>
          {filters.startDate} to {filters.endDate}
          {filters.dayType !== "all" && ` · ${filters.dayType}`}
          {(filters.hourStart !== 0 || filters.hourEnd !== 23) &&
            ` · ${filters.hourStart}:00–${filters.hourEnd}:00`}
          {filters.userType && ` · ${filters.userType}`}
          {filters.bikeType && ` · ${filters.bikeType.replace("_", " ")}`}
          {filters.stationId &&
            ` · station: ${sortedStations.find((s) => s.station_id === filters.stationId)?.name ?? filters.stationId}`}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text-primary)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
      {label}
      {children}
    </label>
  );
}
