import { LogisticsProviderDashboard } from '@/components/logistics/logistics-dashboard';
import { getMyLogisticsJobs, getOpenLogisticsRequests } from '@/server/logistics';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LogisticsPage() {
  const [openRes, myJobsRes] = await Promise.all([
    getOpenLogisticsRequests(),
    getMyLogisticsJobs(),
  ]);

  if (!openRes.success || !myJobsRes.success) notFound();

  return <LogisticsProviderDashboard openRequests={openRes.data} myJobs={myJobsRes.data} />;
}
