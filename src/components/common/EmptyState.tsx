import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = "No data to show",
  message = "No records match the selected filters. Try expanding the date range or clearing one or more filters.",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border-strong)] px-6 py-10 text-center"
    >
      <Inbox aria-hidden="true" size={20} className="mb-1 text-[var(--color-text-muted)]" />
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
      <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}
