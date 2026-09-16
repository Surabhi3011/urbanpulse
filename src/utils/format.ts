const intFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatInt(n: number): string {
  return intFormatter.format(Math.round(n));
}

export function formatCompact(n: number): string {
  return compactFormatter.format(n);
}

export function formatMinutes(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)} min`;
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
