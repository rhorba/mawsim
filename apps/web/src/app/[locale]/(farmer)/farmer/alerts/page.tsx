import { PriceAlertsPanel } from '@/components/alerts/price-alerts-panel';
import { getMyAlerts } from '@/server/price-alerts';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function FarmerAlertsPage() {
  const res = await getMyAlerts();
  if (!res.success) notFound();
  return <PriceAlertsPanel initialAlerts={res.data} />;
}
