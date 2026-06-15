import { GradeBadge } from '@/components/marketplace/badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/session';
import { getPublicListing } from '@/server/public-listings';
import { formatMAD } from '@mawsim/core';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

// SSR per request (queries the DB) — not prerendered at build (CI has no DB).
export const dynamic = 'force-dynamic';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const l = await getPublicListing(id);
  if (!l) notFound();

  const t = await getTranslations();
  const session = await getSession();
  const loc = locale === 'ar' ? 'ar' : 'fr';
  // Buyers go straight to the offer form; everyone else is routed via login.
  const offerHref = session?.role === 'buyer' ? `/buyer/offer/${l.id}` : '/login';
  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(loc === 'ar' ? 'ar-MA' : 'fr-MA', { dateStyle: 'long' }).format(
      new Date(iso)
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/listings"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]"
      >
        ← {t('listingBrowse.back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/9] rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-bg)] flex items-center justify-center">
            <span className="font-display text-5xl font-bold text-[var(--color-primary)]/40">
              {t(`products.${l.productCategory}`)}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-[var(--color-foreground)]">
                {l.productVariety || t(`products.${l.productCategory}`)}
              </h1>
              <GradeBadge grade={l.qualityGrade} label={t(`grades.${l.qualityGrade}`)} />
            </div>
            <p className="text-[var(--color-muted)] mt-1">
              {t(`products.${l.productCategory}`)} · {t(`regions.${l.region}`)}
            </p>
          </div>

          {l.description && (
            <p className="text-[var(--color-foreground)] leading-relaxed whitespace-pre-line">
              {l.description}
            </p>
          )}

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Detail
              label={t('listing.quantity')}
              value={`${l.quantityQtx.toLocaleString(loc)} ${t('common.quintaux')}`}
            />
            <Detail
              label={t('listing.minOrder')}
              value={`${l.minOrderQtx.toLocaleString(loc)} ${t('common.quintaux')}`}
            />
            <Detail label={t('listing.availableUntil')} value={fmtDate(l.availableUntil)} />
            {l.harvestDate && (
              <Detail label={t('listing.harvestDate')} value={fmtDate(l.harvestDate)} />
            )}
            {l.certificationIds.length > 0 && (
              <Detail
                label={t('listing.certifications')}
                value={`✓ ${l.certificationIds.length}`}
              />
            )}
          </dl>
        </div>

        {/* Sidebar: price + farmer + CTA */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="font-display text-3xl font-bold text-[var(--color-primary)] tabular-nums">
                {formatMAD(l.askPricePerQtx, loc)}
              </p>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide">
                {t('common.perQtx')}
              </p>
              <Button asChild className="w-full mt-4">
                <Link href={offerHref}>{t('listing.makeOffer')}</Link>
              </Button>
              {session?.role !== 'buyer' && (
                <p className="text-xs text-[var(--color-muted)] text-center mt-2">
                  {t('listingBrowse.offerNote')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide mb-1">
                {t('listingBrowse.producer')}
              </p>
              <p className="font-semibold text-[var(--color-foreground)]">{l.farmName}</p>
              <p className="text-sm text-[var(--color-muted)] mt-0.5">{t(`regions.${l.region}`)}</p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-[var(--color-warn)]">★ {l.sellerRating.toFixed(1)}</span>
                <span className="text-[var(--color-muted)]">
                  {l.completedDeals} {t('listingBrowse.dealsShort')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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
