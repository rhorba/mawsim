import { AddPriceForm } from '@/components/admin/add-price-form';
import { getRecentPricePoints } from '@/server/admin';
import { formatMAD } from '@mawsim/core';

export const dynamic = 'force-dynamic';

const SOURCE_LABELS: Record<string, string> = {
  onicl: 'ONICL',
  admin_manual: 'Manuel',
  mawsim_transaction: 'Transaction',
};

export default async function AdminPricesPage() {
  const recent = await getRecentPricePoints();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          Gestion du tableau des prix
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Ajoutez des prix de référence ONICL ou manuels visibles sur le tableau public.
        </p>
      </div>

      {/* Add price form */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
          Ajouter un prix de référence
        </h2>
        <AddPriceForm />
      </div>

      {/* Recent prices table */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--color-foreground)]">
          Prix récents (ONICL + manuels)
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Aucun prix de référence enregistré.</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                <tr>
                  {['Produit', 'Variété', 'Région', 'Prix (MAD/qtx)', 'Source', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {recent.map((pp) => (
                  <tr
                    key={pp.id}
                    className="bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors"
                  >
                    <td className="px-4 py-3 capitalize font-medium text-[var(--color-foreground)]">
                      {pp.productCategory}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {pp.productVariety ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{pp.region}</td>
                    <td className="px-4 py-3 font-medium text-end">{formatMAD(pp.pricePerQtx)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          pp.source === 'onicl'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {SOURCE_LABELS[pp.source] ?? pp.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)] whitespace-nowrap">
                      {new Date(pp.recordedAt).toLocaleDateString('fr-MA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
