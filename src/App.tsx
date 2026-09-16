import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { PageSkeleton } from "./components/common/Skeleton";
import { AppShell } from "./components/layout/AppShell";
import { DataProvider } from "./context/DataContext";

// Route-level code splitting: MapLibre (Spatial Explorer) and SheetJS/export
// code are the largest dependencies and most pages don't need them, so each
// page ships as its own chunk instead of one large bundle.
const Overview = lazy(() => import("./pages/Overview"));
const MobilityAnalysis = lazy(() => import("./pages/MobilityAnalysis"));
const NetworkExplorer = lazy(() => import("./pages/NetworkExplorer"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const Methodology = lazy(() => import("./pages/Methodology"));

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Suspense fallback={<PageSkeleton />}><Overview /></Suspense>} />
            <Route path="mobility" element={<Suspense fallback={<PageSkeleton />}><MobilityAnalysis /></Suspense>} />
            <Route path="explorer" element={<Suspense fallback={<PageSkeleton />}><NetworkExplorer /></Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<PageSkeleton />}><AdvancedAnalytics /></Suspense>} />
            <Route path="methodology" element={<Suspense fallback={<PageSkeleton />}><Methodology /></Suspense>} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}
