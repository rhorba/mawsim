import { DisputeQueue } from '@/components/admin/dispute-queue';
import { getAdminDisputes } from '@/server/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDisputesPage() {
  const disputes = await getAdminDisputes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          Litiges en cours
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {disputes.length} litige{disputes.length !== 1 ? 's' : ''} en attente de résolution
        </p>
      </div>

      <DisputeQueue initialDisputes={disputes} />
    </div>
  );
}
