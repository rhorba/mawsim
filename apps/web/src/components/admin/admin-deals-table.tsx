import type { AdminDealRow } from '@/server/admin';
import { formatMAD } from '@mawsim/core';

const STATUS_COLORS: Record<string, string> = {
  offer_made: 'bg-blue-100 text-blue-800',
  negotiating: 'bg-yellow-100 text-yellow-800',
  agreed: 'bg-green-100 text-green-800',
  contract_signed: 'bg-teal-100 text-teal-800',
  escrow_funded: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-[var(--color-secondary)] text-white',
  disputed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

const STATUS_FR: Record<string, string> = {
  offer_made: 'Offre faite',
  negotiating: 'Négociation',
  agreed: 'Accord',
  contract_signed: 'Contrat signé',
  escrow_funded: 'Séquestre financé',
  in_transit: 'En transit',
  delivered: 'Livré',
  completed: 'Complété',
  disputed: 'Litige',
  cancelled: 'Annulé',
};

interface AdminDealsTableProps {
  deals: AdminDealRow[];
  emptyMessage?: string;
}

export function AdminDealsTable({
  deals,
  emptyMessage = 'Aucune transaction.',
}: AdminDealsTableProps) {
  if (deals.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
          <tr>
            {['Producteur', 'Acheteur', 'Produit', 'Qté (qtx)', 'Montant', 'Statut', 'Date'].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {deals.map((deal) => (
            <tr
              key={deal.id}
              className="bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors"
            >
              <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                {deal.farmName}
              </td>
              <td className="px-4 py-3 text-[var(--color-muted)]">{deal.companyName}</td>
              <td className="px-4 py-3">
                <span className="capitalize">{deal.productCategory}</span>
                {deal.productVariety && (
                  <span className="text-[var(--color-muted)]"> — {deal.productVariety}</span>
                )}
              </td>
              <td className="px-4 py-3 text-end">{deal.quantityQtx.toLocaleString('fr-MA')}</td>
              <td className="px-4 py-3 text-end font-medium">{formatMAD(deal.totalAmount)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {STATUS_FR[deal.status] ?? deal.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--color-muted)] whitespace-nowrap">
                {new Date(deal.createdAt).toLocaleDateString('fr-MA')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
