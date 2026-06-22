import { DealThread } from '@/components/deals/deal-thread';
import { getSession } from '@/lib/session';
import { getDealLogisticsRequest } from '@/server/logistics';
import { getDealThread } from '@/server/negotiation';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function FarmerDealPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const loc = locale === 'ar' ? 'ar' : 'fr';
  const session = await getSession();
  const [res, logisticsRes] = await Promise.all([getDealThread(id), getDealLogisticsRequest(id)]);
  if (!session || !res.success || !res.data) notFound();

  const logistics = logisticsRes.success ? logisticsRes.data : null;

  return (
    <DealThread
      thread={res.data}
      viewerUserId={session.userId}
      basePath="/farmer/deals"
      locale={loc}
      logisticsRequest={logistics?.request ?? null}
      logisticsQuotes={logistics?.quotes ?? []}
    />
  );
}
