import {
  AlertCircle,
  Database,
  Info,
  Layers,
  Server,
  Sparkles,
  SquareStack,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useUrbanPulseData } from "../context/DataContext";
import { formatInt } from "../utils/format";

export default function Methodology() {
  const { meta } = useUrbanPulseData();
  const d = meta.dataset;
  const rc = meta.record_counts;

  return (
    <div className="flex flex-col gap-6 text-sm text-[var(--color-text-secondary)]">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Methodology &amp; Data Sources
        </h1>
        <p>Dataset details, cleaning steps, metric definitions, and known limitations.</p>
      </div>

      <Section title="Dataset" icon={Database}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <Row label="Name" value={d.name} />
          <Row label="Publisher" value={d.publisher} />
          <Row label="Source" value={d.source_url} link />
          <Row label="Date range" value={`${d.date_range.start} to ${d.date_range.end}`} />
          <Row label="Geographic coverage" value={d.geographic_coverage} />
        </dl>
        <p className="mt-3">{d.license_note}</p>
      </Section>

      <Section title="Record Counts" icon={SquareStack}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Raw records" value={formatInt(rc.total_raw)} />
          <Stat label="After cleaning" value={formatInt(rc.total_cleaned)} />
          <Stat label="Dropped: bad duration" value={formatInt(rc.dropped_invalid_duration)} />
          <Stat label="Dropped: missing coords" value={formatInt(rc.dropped_missing_coords)} />
          <Stat label="Dropped: depot stations" value={formatInt(rc.dropped_depot_station)} />
          <Stat label="Dropped: out-of-range date" value={formatInt(rc.dropped_out_of_range_date)} />
          <Stat label="Stations after cleaning" value={formatInt(meta.stations.count_after_cleaning)} />
          <Stat label="Top routes shipped" value={formatInt(meta.routes.top_routes_shipped)} />
        </div>
      </Section>

      <Section title="Cleaning Steps" icon={Sparkles}>
        <ol className="list-inside list-decimal space-y-1.5">
          {meta.cleaning_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section title="Aggregation Grains" icon={Layers}>
        <p className="mb-2">
          The frontend never loads raw trip-level data. Instead, a Python (Polars) pipeline
          precomputes a handful of small fact tables at these grains:
        </p>
        <dl className="flex flex-col gap-1.5">
          {Object.entries(meta.aggregation_grains).map(([file, grain]) => (
            <div key={file} className="flex flex-col sm:flex-row sm:gap-2">
              <dt className="shrink-0 font-mono text-xs text-[var(--color-text-primary)]">{file}</dt>
              <dd>{grain}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Anomaly Detection Method" icon={AlertCircle}>
        <p>{meta.anomaly_method.description}</p>
      </Section>

      <Section title="Forecast Method" icon={TrendingUp}>
        <p>{meta.forecast_method.description}</p>
      </Section>

      <Section title="Known Limitations" icon={Info}>
        <ul className="list-inside list-disc space-y-1.5">
          {meta.known_limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Section>

      <Section title="Application Architecture" icon={Server}>
        <p>{meta.architecture}</p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Pipeline last run: {new Date(meta.generated_at).toLocaleString()}
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
        <Icon aria-hidden="true" size={15} className="text-[var(--color-accent)]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="flex justify-between gap-2 border-b border-[var(--color-border)] py-1 last:border-0 sm:col-span-1">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="text-right text-[var(--color-text-primary)]">
        {link ? (
          <a href={value} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-surface-subtle)] p-3 text-center">
      <p className="text-xs uppercase text-[var(--color-text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}
