import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  comparison?: {
    pctDiff: number | null;
    positiveIsGood?: boolean;
  };
}

export function KpiCard({ icon: Icon, label, value, sublabel, comparison }: KpiCardProps) {
  const pct = comparison?.pctDiff ?? null;
  const positiveIsGood = comparison?.positiveIsGood ?? true;
  const isGood = pct !== null && (pct >= 0) === positiveIsGood;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="flex items-center gap-1.5">
        <Icon aria-hidden="true" size={14} className="text-[var(--color-text-muted)]" />
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
      {(sublabel || pct !== null) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
          {pct !== null && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                isGood ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
              }`}
            >
              {pct >= 0 ? (
                <ArrowUp aria-hidden="true" size={12} />
              ) : (
                <ArrowDown aria-hidden="true" size={12} />
              )}
              {Math.abs(pct).toFixed(1)}%
            </span>
          )}
          {sublabel && <span>{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
