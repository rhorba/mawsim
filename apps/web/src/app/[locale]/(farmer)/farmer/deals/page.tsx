import { DealsList } from '@/components/deals/deals-list';
import { getMyDeals } from '@/server/negotiation';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function FarmerDealsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale === 'ar' ? 'ar' : 'fr';
  const t = await getTranslations();
  const res = await getMyDeals();
  const deals = res.success ? res.data : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          {t('deal.myTitle')}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t('deal.mySubtitle')}</p>
      </header>
      <DealsList deals={deals} basePath="/farmer/deals" locale={loc} />
    </div>
  );
}
