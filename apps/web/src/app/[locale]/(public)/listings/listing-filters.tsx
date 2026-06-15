'use client';

import { useRouter } from '@/i18n/navigation';
import { MoroccanRegions } from '@mawsim/core';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const PRODUCTS = [
  'cereals',
  'olives',
  'dates',
  'citrus',
  'vegetables',
  'argan',
  'legumes',
  'other',
] as const;
const GRADES = ['premium', 'grade_a', 'grade_b', 'standard'] as const;

const selectClass =
  'h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

type Filters = { product: string; region: string; grade: string; maxPrice: string };

export function ListingFilters({ initial }: { initial: Filters }) {
  const t = useTranslations();
  const router = useRouter();
  const [f, setF] = useState<Filters>(initial);

  function apply(next: Filters) {
    const params = new URLSearchParams();
    if (next.product) params.set('product', next.product);
    if (next.region) params.set('region', next.region);
    if (next.grade) params.set('grade', next.grade);
    if (next.maxPrice) params.set('maxPrice', next.maxPrice);
    const qs = params.toString();
    router.replace(qs ? `/listings?${qs}` : '/listings');
  }

  function update(patch: Partial<Filters>) {
    const next = { ...f, ...patch };
    setF(next);
    apply(next);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
        {t('common.product')}
        <select
          className={selectClass}
          value={f.product}
          onChange={(e) => update({ product: e.target.value })}
        >
          <option value="">{t('common.all')}</option>
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>
              {t(`products.${p}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
        {t('common.region')}
        <select
          className={selectClass}
          value={f.region}
          onChange={(e) => update({ region: e.target.value })}
        >
          <option value="">{t('common.all')}</option>
          {MoroccanRegions.map((r) => (
            <option key={r} value={r}>
              {t(`regions.${r}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
        {t('common.grade')}
        <select
          className={selectClass}
          value={f.grade}
          onChange={(e) => update({ grade: e.target.value })}
        >
          <option value="">{t('common.all')}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {t(`grades.${g}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
        {t('listingBrowse.maxPrice')}
        <input
          type="number"
          min="0"
          inputMode="numeric"
          className={`${selectClass} w-32`}
          defaultValue={f.maxPrice}
          onBlur={(e) => update({ maxPrice: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update({ maxPrice: (e.target as HTMLInputElement).value });
          }}
        />
      </label>

      {(f.product || f.region || f.grade || f.maxPrice) && (
        <button
          type="button"
          onClick={() => {
            setF({ product: '', region: '', grade: '', maxPrice: '' });
            router.replace('/listings');
          }}
          className="h-10 px-3 text-sm text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
        >
          {t('listingBrowse.reset')}
        </button>
      )}
    </div>
  );
}
