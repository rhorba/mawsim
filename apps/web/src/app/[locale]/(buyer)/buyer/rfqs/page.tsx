import { StatusBadge } from '@/components/marketplace/badges';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getMyRfqs } from '@/server/rfq';
import { getTranslations } from 'next-intl/server';

// Reads session — never prerender.
export const dynamic = 'force-dynamic';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function BuyerRfqsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale === 'ar' ? 'ar' : 'fr';
  const t = await getTranslations();
  const res = await getMyRfqs();
  const rows = res.success ? res.data : [];
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(loc === 'ar' ? 'ar-MA' : 'fr-MA', { dateStyle: 'medium' }).format(d);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
            {t('rfq.myTitle')}
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t('rfq.mySubtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/buyer/rfqs/new">{t('rfq.new')}</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 text-center text-[var(--color-muted)] py-16 border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)]">
          {t('rfq.empty')}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <th className="text-start px-4 py-3 font-semibold">{t('common.product')}</th>
                <th className="text-end px-4 py-3 font-semibold">{t('common.quantity')}</th>
                <th className="text-start px-4 py-3 font-semibold">{t('rfq.deliveryRegion')}</th>
                <th className="text-start px-4 py-3 font-semibold">{t('rfq.neededBy')}</th>
                <th className="text-end px-4 py-3 font-semibold">{t('rfq.matchesTitle')}</th>
                <th className="text-start px-4 py-3 font-semibold">{t('common.status')}</th>
                <th className="text-end px-4 py-3 font-semibold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {r.productVariety || t(`products.${r.productCategory}`)}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {r.quantityQtxMin.toLocaleString(loc)}–{r.quantityQtxMax.toLocaleString(loc)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {t(`regions.${r.deliveryRegion}`)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{fmtDate(r.neededBy)}</td>
                  <td className="px-4 py-3 text-end tabular-nums font-semibold text-[var(--color-secondary)]">
                    {r.matchedListingIds.length}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} label={t(`rfq.status${cap(r.status)}`)} />
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={`/buyer/rfqs/${r.id}`}
                      className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {t('rfq.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
