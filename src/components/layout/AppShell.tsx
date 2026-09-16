import { BookOpen, LayoutDashboard, LineChart, Map, TrendingUp } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { RequireData } from "../common/RequireData";

const NAV_ITEMS = [
  { to: "/", label: "Overview", end: true, icon: LayoutDashboard },
  { to: "/mobility", label: "Mobility Analysis", icon: TrendingUp },
  { to: "/explorer", label: "Spatial & Network", icon: Map },
  { to: "/analytics", label: "Advanced Analytics", icon: LineChart },
  { to: "/methodology", label: "Methodology", icon: BookOpen },
];

export function AppShell() {
  const location = useLocation();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-x-8 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-accent)] text-sm font-bold text-white">
              U
            </span>
            <span className="text-base font-semibold tracking-tight">UrbanPulse</span>
          </div>
          <nav
            aria-label="Primary"
            className="-mx-1 flex flex-1 gap-1 overflow-x-auto whitespace-nowrap px-1 sm:flex-wrap sm:overflow-visible"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-strong)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
                  }`
                }
              >
                <item.icon aria-hidden="true" size={15} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6">
        <RequireData>
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </RequireData>
      </main>
      <footer className="border-t border-[var(--color-border)] px-4 py-4 text-center text-xs text-[var(--color-text-muted)] sm:px-6">
        UrbanPulse is a static, read-only analytics portfolio project built on NYC Citi Bike system
        data. No live vehicle tracking, accounts, or backend. See{" "}
        <NavLink to="/methodology" className="underline hover:text-[var(--color-text-secondary)]">
          Methodology &amp; Data Sources
        </NavLink>{" "}
        for dataset details and limitations.
      </footer>
    </div>
  );
}
