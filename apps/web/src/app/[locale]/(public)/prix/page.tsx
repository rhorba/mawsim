import { getMarketPrices } from '@mawsim/pricing';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tableau des prix — Mawsim',
  description: 'Prix de référence des produits agricoles au Maroc, mis à jour quotidiennement.',
};

function formatPrice(centimes: number): string {
  return (centimes / 100).toLocaleString('fr-MA', { maximumFractionDigits: 0 });
}

function TrendBadge({ pct }: { pct: number }) {
  if (pct > 2) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
        ↑ +{pct}%
      </span>
    );
  }
  if (pct < -2) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
        ↓ {pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--color-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">
      → stable
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const label =
    source === 'mawsim_transaction' ? 'Mawsim' : source === 'onicl' ? 'ONICL' : 'Réf. manuelle';
  return (
    <span className="text-xs text-[var(--color-muted)] bg-[var(--color-bg)] px-2 py-0.5 rounded border border-[var(--color-border)]">
      {label}
    </span>
  );
}

const PRODUCT_LABELS: Record<string, string> = {
  cereals: 'Céréales',
  olives: 'Olives',
  dates: 'Dattes',
  citrus: 'Agrumes',
  vegetables: 'Légumes',
  argan: 'Argan',
  legumes: 'Légumineuses',
  other: 'Autre',
};

export default async function PrixPage() {
  const t = await getTranslations('priceboard');

  let prices: Awaited<ReturnType<typeof getMarketPrices>> = [];
  try {
    prices = await getMarketPrices({ days: 90 });
  } catch {
    // DB not available (build time / no connection) — render empty state
  }

  // Sort by category then region
  prices.sort(
    (a, b) => a.productCategory.localeCompare(b.productCategory) || a.region.localeCompare(b.region)
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--color-foreground)]">
          {t('title')}
        </h1>
        <p className="text-[var(--color-muted)] mt-2">{t('subtitle')}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
          <span>
            Sources : <strong className="text-[var(--color-foreground)]">ONICL</strong> ·
            Transactions Mawsim · Références manuelles
          </span>
          <span>•</span>
          <span>Prix en MAD / quintal</span>
          <span>•</span>
          <span>Fenêtre : 90 jours glissants</span>
        </div>
      </div>

      {/* Price table */}
      {prices.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-muted)]">{t('noData')}</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <table className="w-full price-table text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  Produit
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  Variété
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  Région
                </th>
                <th className="text-end px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  {t('avgPrice')}
                </th>
                <th className="text-end px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  {t('minMax')}
                </th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  {t('trend')}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  Source
                </th>
                <th className="text-end px-4 py-3 font-semibold text-[var(--color-foreground)]">
                  {t('dataPoints')}
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p, i) => (
                <tr
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable server render
                  key={i}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]/50"
                >
                  <td className="px-4 py-3 font-medium">
                    {PRODUCT_LABELS[p.productCategory] ?? p.productCategory}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{p.productVariety ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{p.region}</td>
                  <td className="px-4 py-3 text-end font-semibold tabular-nums text-[var(--color-primary)]">
                    {formatPrice(p.avgPricePerQtx)}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums text-xs text-[var(--color-muted)]">
                    {formatPrice(p.minPricePerQtx)} / {formatPrice(p.maxPricePerQtx)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TrendBadge pct={p.trendPct} />
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={p.primarySource} />
                  </td>
                  <td className="px-4 py-3 text-end text-[var(--color-muted)]">{p.dataPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-[var(--color-muted)] mt-4 text-end">
        Prix agrégés à partir des transactions Mawsim et des données de référence ONICL. Mis à jour
        quotidiennement. Non contractuels.
      </p>
    </div>
  );
}
