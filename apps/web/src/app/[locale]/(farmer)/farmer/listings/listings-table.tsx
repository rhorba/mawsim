'use client';

import { StatusBadge } from '@/components/marketplace/badges';
import { Link } from '@/i18n/navigation';
import { cancelListing, expireListing, publishListing } from '@/server/listing';
import { formatMAD } from '@mawsim/core';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export type FarmerListingRow = {
  id: string;
  productCategory: string;
  productVariety: string | null;
  quantityQtx: number;
  qualityGrade: string;
  askPricePerQtx: number;
  region: string;
  status: string;
  availableUntil: string;
};

export function ListingsTable({ rows, locale }: { rows: FarmerListingRow[]; locale: 'fr' | 'ar' }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function run(id: string, action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await action(id);
      setBusyId(null);
      if (!res.success) {
        setError(res.error ?? t('common.noResults'));
        return;
      }
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="mt-6 text-center text-[var(--color-muted)] py-16 border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)]">
        {t('myListings.empty')}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-sm)]">
          {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-start">
              <th className="text-start px-4 py-3 font-semibold">{t('common.product')}</th>
              <th className="text-start px-4 py-3 font-semibold">{t('common.region')}</th>
              <th className="text-end px-4 py-3 font-semibold">{t('common.quantity')}</th>
              <th className="text-end px-4 py-3 font-semibold">{t('common.price')}</th>
              <th className="text-start px-4 py-3 font-semibold">{t('common.status')}</th>
              <th className="text-end px-4 py-3 font-semibold">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  {r.productVariety || t(`products.${r.productCategory}`)}
                </td>
                <td className="px-4 py-3 text-[var(--color-muted)]">{t(`regions.${r.region}`)}</td>
                <td className="px-4 py-3 text-end tabular-nums">
                  {r.quantityQtx.toLocaleString(locale)}
                </td>
                <td className="px-4 py-3 text-end tabular-nums text-[var(--color-primary)] font-semibold">
                  {formatMAD(r.askPricePerQtx, locale)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} label={t(`listing.status${cap(r.status)}`)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 text-xs">
                    <Link
                      href={`/listings/${r.id}`}
                      className="text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                    >
                      {t('listing.viewDetails')}
                    </Link>
                    {r.status === 'draft' && (
                      <button
                        type="button"
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, publishListing)}
                        className="font-medium text-[var(--color-primary)] hover:underline disabled:opacity-50"
                      >
                        {t('myListings.publish')}
                      </button>
                    )}
                    {r.status === 'active' && (
                      <button
                        type="button"
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, expireListing)}
                        className="font-medium text-[var(--color-muted)] hover:underline disabled:opacity-50"
                      >
                        {t('myListings.expire')}
                      </button>
                    )}
                    {(r.status === 'draft' || r.status === 'active') && (
                      <button
                        type="button"
                        disabled={pending && busyId === r.id}
                        onClick={() => run(r.id, cancelListing)}
                        className="font-medium text-[var(--color-danger)] hover:underline disabled:opacity-50"
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
