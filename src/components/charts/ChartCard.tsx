import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import {
  BarChart,
  HeatmapChart,
  LineChart,
  PieChart,
  ScatterChart,
} from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import { ImageDown } from "lucide-react";
import { EmptyState } from "../common/EmptyState";

echarts.use([
  BarChart,
  HeatmapChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

interface ChartCardProps {
  title: string;
  subtitle?: string;
  option: EChartsOption | null;
  height?: number;
  isEmpty?: boolean;
  emptyMessage?: string;
  notApplicableNote?: string;
  ariaSummary?: string;
}

/** Thin ECharts wrapper reused by every chart component, so height, resize
 * handling, empty/not-applicable states, and accessible summaries are
 * consistent everywhere instead of re-implemented per chart. */
export function ChartCard({
  title,
  subtitle,
  option,
  height = 300,
  isEmpty = false,
  emptyMessage,
  notApplicableNote,
  ariaSummary,
}: ChartCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current || isEmpty || !option) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current);
    }
    chartRef.current.setOption(option, true);
  }, [option, isEmpty]);

  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  const handleExportPng = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 print:break-inside-avoid">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--color-text-secondary)]">{subtitle}</p>}
        </div>
        {!isEmpty && option && (
          <button
            type="button"
            onClick={handleExportPng}
            className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-border-strong)] px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] print:hidden"
            aria-label={`Export ${title} as PNG`}
          >
            <ImageDown aria-hidden="true" size={13} />
            PNG
          </button>
        )}
      </div>
      {notApplicableNote && (
        <p className="mb-2 rounded-md bg-[var(--color-surface-subtle)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
          {notApplicableNote}
        </p>
      )}
      {isEmpty ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div
          ref={containerRef}
          style={{ height }}
          role="img"
          aria-label={ariaSummary ?? title}
        />
      )}
    </div>
  );
}
