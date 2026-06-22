// Price board aggregation — sources: mawsim_transaction, onicl, admin_manual
// Outlier filtering: IQR-based (drop below Q1-1.5×IQR and above Q3+1.5×IQR).

import { db } from '@mawsim/db';
import { pricePoints } from '@mawsim/db/schema';
import { and, desc, eq, gte } from 'drizzle-orm';

export interface PriceSummary {
  productCategory: string;
  productVariety?: string;
  region: string;
  /** Average price per quintal in centimes (integer). */
  avgPricePerQtx: number;
  minPricePerQtx: number;
  maxPricePerQtx: number;
  dataPoints: number;
  lastUpdated: string; // ISO date string
  /** Latest source type in the window. */
  primarySource: 'mawsim_transaction' | 'onicl' | 'admin_manual';
  /** Trend vs 30-day prior window: positive = rising, 0 = stable, negative = falling. */
  trendPct: number;
}

export interface PriceHistoryPoint {
  recordedAt: string; // ISO
  pricePerQtx: number; // centimes
  source: string;
}

/** Return market price summaries. Optionally filter by category or region. */
export async function getMarketPrices(params?: {
  productCategory?: string;
  region?: string;
  days?: number;
}): Promise<PriceSummary[]> {
  const windowDays = params?.days ?? 90;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const conditions = [gte(pricePoints.recordedAt, since)];
  if (params?.productCategory) {
    conditions.push(eq(pricePoints.productCategory, params.productCategory));
  }
  if (params?.region) {
    conditions.push(eq(pricePoints.region, params.region));
  }

  const rows = await db
    .select()
    .from(pricePoints)
    .where(and(...conditions))
    .orderBy(desc(pricePoints.recordedAt));

  // Group by (category, variety, region)
  type Key = string;
  const groups = new Map<Key, typeof rows>();
  for (const r of rows) {
    const key = `${r.productCategory}|${r.productVariety ?? ''}|${r.region}`;
    const g = groups.get(key) ?? [];
    g.push(r);
    groups.set(key, g);
  }

  const summaries: PriceSummary[] = [];

  for (const [, pts] of groups) {
    const prices = pts.map((p) => p.pricePerQtx);
    const filtered = iqrFilter(prices);
    if (filtered.length === 0) continue;

    const avg = Math.round(filtered.reduce((s, v) => s + v, 0) / filtered.length);
    const min = Math.min(...filtered);
    const max = Math.max(...filtered);
    const latest = pts[0];
    if (!latest) continue;

    // Prior-window avg for trend (previous 30-day window before `since`)
    const priorSince = new Date(since.getTime() - 30 * 24 * 60 * 60 * 1000);
    const priorPts = pts.filter((p) => p.recordedAt >= priorSince && p.recordedAt < since);
    const trendPct =
      priorPts.length > 0
        ? (() => {
            const priorAvg = priorPts.reduce((s, p) => s + p.pricePerQtx, 0) / priorPts.length;
            return Math.round(((avg - priorAvg) / priorAvg) * 100);
          })()
        : 0;

    summaries.push({
      productCategory: latest.productCategory,
      ...(latest.productVariety ? { productVariety: latest.productVariety } : {}),
      region: latest.region,
      avgPricePerQtx: avg,
      minPricePerQtx: min,
      maxPricePerQtx: max,
      dataPoints: pts.length,
      lastUpdated: latest.recordedAt.toISOString(),
      primarySource: latest.source,
      trendPct,
    });
  }

  return summaries;
}

/** Price history for a product+region over the past N months (for charts). */
export async function getMarketHistory(params: {
  productCategory: string;
  productVariety?: string;
  region: string;
  months?: number;
}): Promise<PriceHistoryPoint[]> {
  const monthsBack = params.months ?? 12;
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const conditions = [
    eq(pricePoints.productCategory, params.productCategory),
    eq(pricePoints.region, params.region),
    gte(pricePoints.recordedAt, since),
  ];
  if (params.productVariety) {
    conditions.push(eq(pricePoints.productVariety, params.productVariety));
  }

  const rows = await db
    .select({
      recordedAt: pricePoints.recordedAt,
      pricePerQtx: pricePoints.pricePerQtx,
      source: pricePoints.source,
    })
    .from(pricePoints)
    .where(and(...conditions))
    .orderBy(pricePoints.recordedAt);

  return rows.map((r) => ({
    recordedAt: r.recordedAt.toISOString(),
    pricePerQtx: r.pricePerQtx,
    source: r.source,
  }));
}

/** IQR-based outlier filter: drop points outside [Q1-1.5×IQR, Q3+1.5×IQR]. */
function iqrFilter(values: number[]): number[] {
  if (values.length < 4) return values; // too few points for IQR to be meaningful
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const iqr = q3 - q1;
  if (iqr === 0) return values;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return values.filter((v) => v >= lo && v <= hi);
}
