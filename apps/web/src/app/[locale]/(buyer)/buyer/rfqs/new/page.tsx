import { RfqForm } from '../rfq-form';

// Reads session via the action it calls — never prerender.
export const dynamic = 'force-dynamic';

export default async function NewRfqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RfqForm locale={locale === 'ar' ? 'ar' : 'fr'} />;
}
