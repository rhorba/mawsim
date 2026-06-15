import { NegotiationPanel } from '@/components/deals/negotiation-panel';
import { StatusBadge } from '@/components/marketplace/badges';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { DealThread as DealThreadData } from '@/server/deal-types';
import { formatMAD } from '@mawsim/core';
import { getTranslations } from 'next-intl/server';

export async function DealThread({
  thread,
  viewerUserId,
  basePath,
  locale,
}: {
  thread: DealThreadData;
  viewerUserId: string;
  basePath: string;
  locale: 'fr' | 'ar';
}) {
  const t = await getTranslations();
  const { deal, offers } = thread;
  const standing = offers[0];

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', { dateStyle: 'long' }).format(d);
  const fmtDateTime = (d: Date) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={basePath}
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]"
      >
        ← {t('deal.myTitle')}
      </Link>

      {/* Deal summary */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
                {deal.productVariety || t(`products.${deal.productCategory}`)}
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                {t('deal.counterparty')}: {thread.counterpartyName} ·{' '}
                {t(`regions.${deal.deliveryRegion}`)}
              </p>
            </div>
            <StatusBadge status={deal.status} label={t(`deal.status.${deal.status}`)} />
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Detail
              label={t('common.quantity')}
              value={`${deal.quantityQtx.toLocaleString(locale)} ${t('common.quintaux')}`}
            />
            <Detail
              label={t('deal.pricePerQtx')}
              value={formatMAD(deal.agreedPricePerQtx, locale)}
            />
            <Detail label={t('deal.total')} value={formatMAD(deal.totalAmount, locale)} />
            <Detail label={t('deal.deliveryDate')} value={fmtDate(deal.deliveryDate)} />
          </dl>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <NegotiationPanel
            dealId={deal.id}
            status={deal.status}
            canRespond={thread.canRespond}
            viewerSide={thread.viewerSide}
            standingPricePerQtx={standing?.pricePerQtx ?? deal.agreedPricePerQtx}
            standingQuantityQtx={standing?.quantityQtx ?? deal.quantityQtx}
          />
        </CardContent>
      </Card>

      {/* Offer history (newest first) */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-[var(--color-foreground)]">
          {t('deal.history')}
        </h2>
        {offers.map((o) => {
          const mine = o.authorUserId === viewerUserId;
          return (
            <Card key={o.id} className={mine ? 'border-[var(--color-primary)]' : undefined}>
              <CardContent className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--color-muted)]">
                    {t('deal.offerBy')}: {mine ? t('deal.you') : thread.counterpartyName} ·{' '}
                    {fmtDateTime(o.createdAt)}
                  </p>
                  {o.message && (
                    <p className="text-sm text-[var(--color-foreground)] mt-1 whitespace-pre-line">
                      {o.message}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold tabular-nums text-[var(--color-foreground)]">
                    {formatMAD(o.pricePerQtx, locale)}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {o.quantityQtx.toLocaleString(locale)} {t('common.quintaux')}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--color-muted)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--color-foreground)] mt-0.5">{value}</dd>
    </div>
  );
}
