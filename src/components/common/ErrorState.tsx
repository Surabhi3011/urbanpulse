import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--color-negative)]/30 bg-[var(--color-negative)]/5 px-6 py-10 text-center"
    >
      <AlertTriangle aria-hidden="true" size={20} className="text-[var(--color-negative)]" />
      <p className="text-sm font-medium text-[var(--color-negative)]">Something went wrong</p>
      <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
        >
          Retry
        </button>
      )}
    </div>
  );
}
