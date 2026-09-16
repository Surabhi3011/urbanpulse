import { Bike, Briefcase, Sun, User, UserCheck, Zap, type LucideIcon } from "lucide-react";

/** Consistent icon + color per category value, reused everywhere that
 * category appears (KPIs, legends, charts) so the same concept always
 * looks the same across the dashboard.
 *
 * Colors are plain hex, matching the --color-cat-* CSS variables in
 * index.css, rather than `var(...)` references: ECharts paints series
 * through <canvas>, and canvas fillStyle cannot resolve CSS custom
 * properties (there's no element/cascade context for it to read from), so
 * a var() string here would silently fail to render in charts. */
export const USER_TYPE_META: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  member: { icon: UserCheck, label: "Member", color: "#2563eb" },
  casual: { icon: User, label: "Casual", color: "#f97316" },
};

export const BIKE_TYPE_META: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  classic_bike: { icon: Bike, label: "Classic bike", color: "#0891b2" },
  electric_bike: { icon: Zap, label: "Electric bike", color: "#7c3aed" },
  docked_bike: { icon: Bike, label: "Docked bike", color: "#64748b" },
};

export const DAY_TYPE_META: Record<"weekday" | "weekend", { icon: LucideIcon; label: string; color: string }> = {
  weekday: { icon: Briefcase, label: "Weekday", color: "#2563eb" },
  weekend: { icon: Sun, label: "Weekend", color: "#f97316" },
};
