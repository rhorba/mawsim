import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getMyListings } from '@/server/listing';
import { getTranslations } from 'next-intl/server';
import { ListingsTable } from './listings-table';

// Reads session — never prerender.
export const dynamic = 'force-dynamic';

export default async function FarmerListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const res = await getMyListings();
  const rows = (res.success ? res.data : []).map((l) => ({
    id: l.id,
    productCategory: l.productCategory,
    productVariety: l.productVariety,
    quantityQtx: l.quantityQtx,
    qualityGrade: l.qualityGrade,
    askPricePerQtx: l.askPricePerQtx,
    region: l.region,
    status: l.status,
    availableUntil: l.availableUntil.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
            {t('myListings.title')}
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t('myListings.subtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/farmer/listings/new">{t('listing.new')}</Link>
        </Button>
      </div>

      <ListingsTable rows={rows} locale={locale === 'ar' ? 'ar' : 'fr'} />
    </div>
  );
}
