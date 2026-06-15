import { DealThread } from '@/components/deals/deal-thread';
import { getSession } from '@/lib/session';
import { getDealThread } from '@/server/negotiation';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BuyerDealPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const loc = locale === 'ar' ? 'ar' : 'fr';
  const session = await getSession();
  const res = await getDealThread(id);
  if (!session || !res.success || !res.data) notFound();

  return (
    <DealThread
      thread={res.data}
      viewerUserId={session.userId}
      basePath="/buyer/deals"
      locale={loc}
    />
  );
}
