import { AdminDealsTable } from '@/components/admin/admin-deals-table';
import { getAdminDeals } from '@/server/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDealsPage() {
  const deals = await getAdminDeals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          Toutes les transactions
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {deals.length} transaction{deals.length !== 1 ? 's' : ''} au total
        </p>
      </div>

      <AdminDealsTable deals={deals} emptyMessage="Aucune transaction enregistrée." />
    </div>
  );
}
