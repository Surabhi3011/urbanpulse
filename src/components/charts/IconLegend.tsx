import type { LucideIcon } from "lucide-react";

export interface IconLegendItem {
  icon: LucideIcon;
  label: string;
  color: string;
}

/** A small icon+color legend rendered alongside (not instead of) a chart's
 * own legend/tooltip. Color alone shouldn't carry meaning (member vs.
 * casual, weekday vs. weekend, bike type), so this gives each category a
 * distinct icon as a second, colorblind-safe encoding. */
export function IconLegend({ items }: { items: IconLegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]"
          >
            <Icon aria-hidden="true" size={14} style={{ color: item.color }} />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
