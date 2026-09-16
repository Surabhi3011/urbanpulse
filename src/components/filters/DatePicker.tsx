import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePopoverPosition } from "../../hooks/usePopoverPosition";

interface DatePickerProps {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (date: string) => void;
}

const WEEKDAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

function formatDisplay(iso: string): string {
  if (!iso) return "Select date";
  const { y, m, d } = parseIso(iso);
  return `${MONTH_NAMES[m].slice(0, 3)} ${d}, ${y}`;
}

/** Accessible calendar date picker. Dates outside [min, max] are visibly
 * disabled and unclickable -- used so the "end date" field can't select
 * anything before the current "start date", and vice versa. */
export function DatePicker({ label, value, min, max, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const initial = value ? parseIso(value) : min ? parseIso(min) : { y: 2026, m: 0, d: 1 };
  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const position = usePopoverPosition(triggerRef, open);

  useEffect(() => {
    if (!value) return;
    const { y, m } = parseIso(value);
    setViewYear(y);
    setViewMonth(m);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const minAllowsPrev = !min || `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}` > min.slice(0, 7);
  const maxAllowsNext = !max || `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}` < max.slice(0, 7);

  return (
    <div className="relative" ref={containerRef}>
      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
        {label}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1.5 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
        >
          <Calendar aria-hidden="true" size={14} className="text-[var(--color-text-muted)]" />
          {formatDisplay(value)}
        </button>
      </label>
      {open && position && (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          style={{ top: position.top, left: position.left }}
          className="fixed z-40 w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              disabled={!minAllowsPrev}
              aria-label="Previous month"
              className="rounded px-2 py-1 hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft aria-hidden="true" size={16} />
            </button>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              disabled={!maxAllowsNext}
              aria-label="Next month"
              className="rounded px-2 py-1 hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-text-muted)]">
            {WEEKDAY_HEADERS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const iso = toIso(viewYear, viewMonth, day);
              const disabled = (min && iso < min) || (max && iso > max);
              const isSelected = iso === value;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!!disabled}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  aria-current={isSelected ? "date" : undefined}
                  className={`rounded py-1 text-sm tabular-nums ${
                    isSelected
                      ? "bg-[var(--color-accent)] font-semibold text-white"
                      : disabled
                        ? "cursor-not-allowed text-[var(--color-text-muted)] opacity-40"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
