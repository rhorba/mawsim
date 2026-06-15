import { StatusBadge } from '@/components/marketplace/badges';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { DealSummary } from '@/server/deal-types';
import { formatMAD } from '@mawsim/core';
import { getTranslations } from 'next-intl/server';

export async function DealsList({
  deals,
  basePath,
  locale,
}: {
  deals: DealSummary[];
  basePath: string;
  locale: 'fr' | 'ar';
}) {
  const t = await getTranslations();
  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', { dateStyle: 'medium' }).format(
      new Date(iso)
    );

  if (deals.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">{t('deal.empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {deals.map((d) => (
        <Link key={d.id} href={`${basePath}/${d.id}`} className="block">
          <Card className="hover:border-[var(--color-primary)] transition-colors">
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-foreground)] truncate">
                    {d.productVariety || t(`products.${d.productCategory}`)}
                  </span>
                  <StatusBadge status={d.status} label={t(`deal.status.${d.status}`)} />
                </div>
                <p className="text-sm text-[var(--color-muted)] mt-0.5 truncate">
                  {d.counterpartyName} · {t(`regions.${d.deliveryRegion}`)} ·{' '}
                  {fmtDate(d.deliveryDate)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-[var(--color-primary)] tabular-nums">
                  {formatMAD(d.totalAmount, locale)}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {d.quantityQtx.toLocaleString(locale)} {t('common.quintaux')} ·{' '}
                  {formatMAD(d.pricePerQtx, locale)}/{t('common.quintaux')}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
