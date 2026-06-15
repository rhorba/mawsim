import { GradeBadge } from '@/components/marketplace/badges';
import { MakeOfferForm } from '@/components/marketplace/make-offer-form';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { getPublicListing } from '@/server/public-listings';
import { formatMAD } from '@mawsim/core';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MakeOfferPage({
  params,
}: {
  params: Promise<{ locale: string; listingId: string }>;
}) {
  const { locale, listingId } = await params;
  const loc = locale === 'ar' ? 'ar' : 'fr';
  const l = await getPublicListing(listingId);
  if (!l) notFound();

  const t = await getTranslations();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/listings/${l.id}`}
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]"
      >
        ← {l.productVariety || t(`products.${l.productCategory}`)}
      </Link>

      <header>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          {t('deal.makeOfferTitle')}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t('deal.makeOfferSubtitle')}</p>
      </header>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--color-foreground)]">
                {l.productVariety || t(`products.${l.productCategory}`)}
              </span>
              <GradeBadge grade={l.qualityGrade} label={t(`grades.${l.qualityGrade}`)} />
            </div>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              {l.farmName} · {t(`regions.${l.region}`)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-[var(--color-primary)]">
              {formatMAD(l.askPricePerQtx, loc)}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {l.quantityQtx.toLocaleString(loc)} {t('common.quintaux')} · {t('listing.minOrder')}{' '}
              {l.minOrderQtx.toLocaleString(loc)}
            </p>
          </div>
        </CardContent>
      </Card>

      <MakeOfferForm
        listingId={l.id}
        defaultQuantity={l.minOrderQtx}
        defaultPrice={l.askPricePerQtx}
      />
    </div>
  );
}
