import { GradeBadge, StatusBadge } from '@/components/marketplace/badges';
import { MatchList } from '@/components/marketplace/match-list';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { getRfq } from '@/server/rfq';
import { formatMAD } from '@mawsim/core';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CloseRfqButton } from './close-rfq';

export const dynamic = 'force-dynamic';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function RfqDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const loc = locale === 'ar' ? 'ar' : 'fr';
  const res = await getRfq(id);
  if (!res.success || !res.data) notFound();

  const { rfq, matches } = res.data;
  const t = await getTranslations();
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(loc === 'ar' ? 'ar-MA' : 'fr-MA', { dateStyle: 'long' }).format(d);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/buyer/rfqs"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]"
      >
        ← {t('rfq.myTitle')}
      </Link>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
                  {rfq.productVariety || t(`products.${rfq.productCategory}`)}
                </h1>
                <GradeBadge
                  grade={rfq.requiredQualityGrade}
                  label={t(`grades.${rfq.requiredQualityGrade}`)}
                />
              </div>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                {t(`products.${rfq.productCategory}`)} · {t(`regions.${rfq.deliveryRegion}`)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={rfq.status} label={t(`rfq.status${cap(rfq.status)}`)} />
              {rfq.status !== 'closed' && <CloseRfqButton rfqId={rfq.id} />}
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Detail
              label={t('common.quantity')}
              value={`${rfq.quantityQtxMin.toLocaleString(loc)}–${rfq.quantityQtxMax.toLocaleString(loc)} ${t('common.quintaux')}`}
            />
            {rfq.maxPricePerQtx != null && (
              <Detail label={t('rfq.maxPrice')} value={formatMAD(rfq.maxPricePerQtx, loc)} />
            )}
            <Detail label={t('rfq.neededBy')} value={fmtDate(rfq.neededBy)} />
          </dl>

          {rfq.description && (
            <p className="text-sm text-[var(--color-foreground)] whitespace-pre-line">
              {rfq.description}
            </p>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold text-[var(--color-foreground)]">
          {t('rfq.matchesTitle')}
        </h2>
        <MatchList matches={matches} locale={loc} />
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
