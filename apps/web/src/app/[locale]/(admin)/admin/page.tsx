import { AdminDealsTable } from '@/components/admin/admin-deals-table';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { getAdminDeals, getDashboardStats } from '@/server/admin';
import { formatMAD } from '@mawsim/core';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [stats, recentDeals] = await Promise.all([getDashboardStats(), getAdminDeals()]);

  const disputedDeals = recentDeals.filter((d) => d.status === 'disputed');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          Tableau de bord administration
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Vue d'ensemble de la plateforme Mawsim.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AdminStatCard
          label="Volume traité (GMV)"
          value={formatMAD(stats.gmvCentimes)}
          accent="primary"
        />
        <AdminStatCard
          label="Transactions actives"
          value={String(stats.activeDeals)}
          href="/admin/deals"
          accent="neutral"
        />
        <AdminStatCard
          label="Litiges en cours"
          value={String(stats.disputes)}
          href="/admin/disputes"
          accent={stats.disputes > 0 ? 'danger' : 'neutral'}
        />
        <AdminStatCard
          label="Certifications à vérifier"
          value={String(stats.pendingCerts)}
          href="/admin/certifications"
          accent={stats.pendingCerts > 0 ? 'warning' : 'neutral'}
        />
        <AdminStatCard
          label="Producteurs inscrits"
          value={String(stats.totalFarmers)}
          accent="neutral"
        />
        <AdminStatCard
          label="Acheteurs inscrits"
          value={String(stats.totalBuyers)}
          accent="neutral"
        />
      </div>

      {/* Disputes alert */}
      {disputedDeals.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-[var(--color-danger)]">
            Litiges en attente de résolution
          </h2>
          <AdminDealsTable deals={disputedDeals} />
        </section>
      )}

      {/* Recent deals */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
          Transactions récentes
        </h2>
        <AdminDealsTable deals={recentDeals.slice(0, 10)} />
      </section>
    </div>
  );
}
