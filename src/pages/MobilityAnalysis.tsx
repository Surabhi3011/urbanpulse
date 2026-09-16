import { useMemo } from "react";
import { ChartCard } from "../components/charts/ChartCard";
import { IconLegend } from "../components/charts/IconLegend";
import { FilterBar } from "../components/filters/FilterBar";
import { useUrbanPulseData } from "../context/DataContext";
import { useFilterStore } from "../context/filterStore";
import {
  compareWeekdayVsWeekend,
  dailyTotals,
  durationDistributionInputs,
  filterTemporalCube,
  hourByWeekdayHeatmap,
  hourlyProfile,
  monthlyTotals,
  userTypeSplit,
  weekdayProfile,
} from "../services/aggregate";
import { DAY_TYPE_META, USER_TYPE_META } from "../utils/categoryIcons";
import { formatInt, WEEKDAY_LABELS } from "../utils/format";

export default function MobilityAnalysis() {
  const { temporalCube } = useUrbanPulseData();
  const filters = useFilterStore();

  const filtered = useMemo(() => filterTemporalCube(temporalCube, filters), [temporalCube, filters]);
  const daily = useMemo(() => dailyTotals(filtered), [filtered]);
  const monthly = useMemo(() => monthlyTotals(filtered), [filtered]);
  const hourly = useMemo(() => hourlyProfile(filtered), [filtered]);
  const weekday = useMemo(() => weekdayProfile(filtered), [filtered]);
  const heatmap = useMemo(() => hourByWeekdayHeatmap(filtered), [filtered]);
  const userSplit = useMemo(() => userTypeSplit(filtered), [filtered]);
  const weekdayVsWeekend = useMemo(() => compareWeekdayVsWeekend(filtered), [filtered]);
  const durationInputs = useMemo(() => durationDistributionInputs(filtered), [filtered]);

  const showMonthly = monthly.length > 1;

  const heatmapData: [number, number, number][] = [];
  for (let wd = 0; wd < 7; wd++) {
    for (let h = 0; h < 24; h++) {
      heatmapData.push([h, wd, heatmap[wd][h]]);
    }
  }
  const heatmapMax = Math.max(1, ...heatmapData.map((d) => d[2]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Mobility Analysis</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Demand patterns over time and across categories.
        </p>
      </div>

      <FilterBar />

      <ChartCard
        title="Daily Demand Trend"
        isEmpty={daily.length === 0}
        option={{
          grid: { left: 48, right: 16, top: 16, bottom: 32 },
          xAxis: { type: "category", data: daily.map((d) => d.date), boundaryGap: false },
          yAxis: { type: "value", name: "Trips" },
          tooltip: { trigger: "axis", valueFormatter: (v) => formatInt(Number(v)) },
          series: [
            {
              type: "line",
              data: daily.map((d) => d.trips),
              smooth: true,
              symbol: "none",
              lineStyle: { color: "#2563eb" },
              areaStyle: { opacity: 0.08 },
            },
          ],
        }}
      />

      {showMonthly && (
        <ChartCard
          title="Monthly Demand Trend"
          isEmpty={monthly.length === 0}
          option={{
            grid: { left: 48, right: 16, top: 16, bottom: 32 },
            xAxis: { type: "category", data: monthly.map((m) => m.month) },
            yAxis: { type: "value", name: "Trips" },
            tooltip: { trigger: "axis", valueFormatter: (v) => formatInt(Number(v)) },
            series: [{ type: "bar", data: monthly.map((m) => m.trips), itemStyle: { color: "#2563eb" } }],
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard
          title="Hour-of-Day Demand"
          isEmpty={hourly.every((h) => h.trips === 0)}
          option={{
            grid: { left: 48, right: 16, top: 16, bottom: 32 },
            xAxis: { type: "category", data: hourly.map((h) => h.hour) },
            yAxis: { type: "value", name: "Trips" },
            tooltip: { trigger: "axis", valueFormatter: (v) => formatInt(Number(v)) },
            series: [{ type: "bar", data: hourly.map((h) => h.trips), itemStyle: { color: "#2563eb" } }],
          }}
        />
        <ChartCard
          title="Day-of-Week Demand"
          isEmpty={weekday.every((w) => w.trips === 0)}
          option={{
            grid: { left: 48, right: 16, top: 16, bottom: 32 },
            xAxis: { type: "category", data: weekday.map((w) => WEEKDAY_LABELS[w.weekday]) },
            yAxis: { type: "value", name: "Trips" },
            tooltip: { trigger: "axis", valueFormatter: (v) => formatInt(Number(v)) },
            series: [{ type: "bar", data: weekday.map((w) => w.trips), itemStyle: { color: "#2563eb" } }],
          }}
        />
      </div>

      <ChartCard
        title="Hour × Weekday Heatmap"
        subtitle="Darker cells indicate higher trip volume"
        height={340}
        isEmpty={heatmapData.every((d) => d[2] === 0)}
        option={{
          grid: { left: 60, right: 16, top: 16, bottom: 40 },
          xAxis: { type: "category", data: Array.from({ length: 24 }, (_, h) => h), splitArea: { show: true } },
          yAxis: { type: "category", data: WEEKDAY_LABELS, splitArea: { show: true } },
          visualMap: {
            min: 0,
            max: heatmapMax,
            orient: "horizontal",
            left: "center",
            bottom: 0,
            inRange: { color: ["#eff4ff", "#2563eb"] },
          },
          tooltip: { formatter: (p: any) => `${WEEKDAY_LABELS[p.value[1]]} ${p.value[0]}:00 — ${formatInt(p.value[2])} trips` },
          series: [
            {
              type: "heatmap",
              data: heatmapData,
              emphasis: { itemStyle: { shadowBlur: 6 } },
            },
          ],
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col">
          <ChartCard
            title="Weekday vs. Weekend"
            isEmpty={weekdayVsWeekend.weekday + weekdayVsWeekend.weekend === 0}
            option={{
              tooltip: { trigger: "item", valueFormatter: (v) => formatInt(Number(v)) },
              legend: { show: false },
              series: [
                {
                  type: "pie",
                  radius: ["45%", "70%"],
                  data: [
                    { name: DAY_TYPE_META.weekday.label, value: weekdayVsWeekend.weekday, itemStyle: { color: DAY_TYPE_META.weekday.color } },
                    { name: DAY_TYPE_META.weekend.label, value: weekdayVsWeekend.weekend, itemStyle: { color: DAY_TYPE_META.weekend.color } },
                  ],
                  label: { formatter: "{b}: {d}%" },
                },
              ],
            }}
          />
          <IconLegend items={[DAY_TYPE_META.weekday, DAY_TYPE_META.weekend]} />
        </div>
        <div className="flex flex-col">
          <ChartCard
            title="User-Type Comparison"
            isEmpty={userSplit.length === 0}
            option={{
              tooltip: { trigger: "item", valueFormatter: (v) => formatInt(Number(v)) },
              legend: { show: false },
              series: [
                {
                  type: "pie",
                  radius: ["45%", "70%"],
                  data: userSplit.map((u) => ({
                    name: USER_TYPE_META[u.userType]?.label ?? u.userType,
                    value: u.trips,
                    itemStyle: { color: USER_TYPE_META[u.userType]?.color ?? "#94a3b8" },
                  })),
                  label: { formatter: "{b}: {d}%" },
                },
              ],
            }}
          />
          <IconLegend
            items={userSplit.map((u) => ({
              icon: USER_TYPE_META[u.userType]?.icon ?? DAY_TYPE_META.weekday.icon,
              label: USER_TYPE_META[u.userType]?.label ?? u.userType,
              color: USER_TYPE_META[u.userType]?.color ?? "#94a3b8",
            }))}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-sm text-[var(--color-text-secondary)]">
        <p>
          Average trip duration across the selected filters is{" "}
          <span className="font-medium text-[var(--color-text-primary)]">
            {durationInputs.avgDurationMin.toFixed(1)} minutes
          </span>{" "}
          across {formatInt(durationInputs.totalTrips)} trips. Per-trip duration distribution
          (histogram/box plot) is derived from the same aggregated fields and shown in{" "}
          <span className="font-medium">Advanced Analytics</span>.
        </p>
        {filters.dayType !== "all" && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Showing "{filters.dayType}" days only.
          </p>
        )}
      </div>
    </div>
  );
}
