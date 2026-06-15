import { ListingCard } from '@/components/marketplace/listing-card';
import { browsePublicListings } from '@/server/public-listings';
import { toMoney } from '@mawsim/core';
import { getTranslations } from 'next-intl/server';
import { ListingFilters } from './listing-filters';

// Public marketplace browse: SSR per request (queries the DB), never prerendered
// at build time — CI builds without a database. Caching is a Sprint 5 concern.
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);

export default async function ListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations();

  const product = str(sp.product);
  const region = str(sp.region);
  const grade = str(sp.grade);
  const maxPrice = str(sp.maxPrice);

  const listings = await browsePublicListings({
    productCategory: product,
    region,
    qualityGrade: grade,
    maxPricePerQtx: maxPrice ? toMoney(Number(maxPrice)) : undefined,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[var(--color-foreground)]">
          {t('listingBrowse.title')}
        </h1>
        <p className="text-[var(--color-muted)] mt-1">{t('listingBrowse.subtitle')}</p>
      </header>

      <ListingFilters
        initial={{
          product: product ?? '',
          region: region ?? '',
          grade: grade ?? '',
          maxPrice: maxPrice ?? '',
        }}
      />

      {listings.length === 0 ? (
        <div className="mt-10 text-center text-[var(--color-muted)] py-16 border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)]">
          {t('listingBrowse.empty')}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} locale={locale === 'ar' ? 'ar' : 'fr'} />
          ))}
        </div>
      )}
    </div>
  );
}
