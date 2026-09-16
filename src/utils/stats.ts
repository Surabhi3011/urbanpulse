export interface HistogramBin {
  label: string;
  count: number;
}

/** Equal-width histogram binning for a plain numeric array (client-side --
 * used only for fields we already have in full, like per-station or
 * per-day totals; never applied to raw per-trip data, which isn't shipped). */
export function histogram(values: number[], binCount = 12): HistogramBin[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: formatBinLabel(min, max), count: values.length }];

  const width = (max - min) / binCount;
  const bins = new Array(binCount).fill(0);
  for (const v of values) {
    const idx = Math.min(binCount - 1, Math.floor((v - min) / width));
    bins[idx]++;
  }
  return bins.map((count, i) => ({
    label: formatBinLabel(min + i * width, min + (i + 1) * width),
    count,
  }));
}

function formatBinLabel(lo: number, hi: number): string {
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n.toFixed(0));
  return `${fmt(lo)}-${fmt(hi)}`;
}

export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return NaN;
  const idx = Math.floor((sortedValues.length - 1) * p);
  return sortedValues[idx];
}

/** Pearson correlation coefficient. Association only -- callers must not
 * present this as causation (see intent.md's data-integrity rules). */
export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}
