import { ChevronDown, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePopoverPosition } from "../../hooks/usePopoverPosition";
import type { Station } from "../../types/data";

interface StationSelectProps {
  stations: Station[];
  value: string | null;
  onChange: (stationId: string | null) => void;
}

/** Searchable station dropdown. Replaces a native <input list> + <datalist>
 * combo, whose "show all options" behavior is inconsistent across browsers
 * (some only show suggestions after the first keystroke) -- this always
 * shows the full, filterable list on open. */
export function StationSelect({ stations, value, onChange }: StationSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const position = usePopoverPosition(triggerRef, open);

  const selected = stations.find((s) => s.station_id === value) ?? null;

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? stations.filter((s) => s.name.toLowerCase().includes(q)) : stations;
    return list.slice(0, 200); // cap rendered rows; typing narrows further
  }, [stations, query]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
        Station
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex min-w-[200px] items-center justify-between gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1.5 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
        >
          <MapPin aria-hidden="true" size={14} className="shrink-0 text-[var(--color-text-muted)]" />
          <span className="flex-1 truncate">{selected ? selected.name : "All stations"}</span>
          <ChevronDown aria-hidden="true" size={14} className="shrink-0 text-[var(--color-text-muted)]" />
        </button>
      </label>
      {open && position && (
        <div
          role="listbox"
          aria-label="Station"
          style={{ top: position.top, left: position.left }}
          className="fixed z-40 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg"
        >
          <div className="relative border-b border-[var(--color-border)] p-2">
            <Search
              aria-hidden="true"
              size={14}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stations..."
              className="w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-1.5 pl-7 pr-2 text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              role="option"
              aria-selected={value === null}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-subtle)] ${
                value === null ? "font-medium text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"
              }`}
            >
              All stations
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">No stations match "{query}".</p>
            )}
            {filtered.map((s) => (
              <button
                key={s.station_id}
                type="button"
                role="option"
                aria-selected={value === s.station_id}
                onClick={() => {
                  onChange(s.station_id);
                  setOpen(false);
                }}
                className={`block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-subtle)] ${
                  value === s.station_id ? "font-medium text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
