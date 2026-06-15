'use client';

import { MatchList } from '@/components/marketplace/match-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createRfq } from '@/server/rfq';
import type { RfqMatchView } from '@/server/rfq-types';
import { MoroccanRegions, toMoney } from '@mawsim/core';
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

const inputClass =
  'w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';
const labelClass = 'text-sm font-medium text-[var(--color-foreground)]';

export function RfqForm({ locale }: { locale: 'fr' | 'ar' }) {
  const t = useTranslations();
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<RfqMatchView[] | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setStatus('saving');

    const maxPrice = fd.get('maxPrice') ? Number(fd.get('maxPrice')) : undefined;
    const payload = {
      productCategory: String(fd.get('productCategory')),
      productVariety: fd.get('productVariety') ? String(fd.get('productVariety')) : undefined,
      quantityQtxMin: Number(fd.get('quantityQtxMin')),
      quantityQtxMax: Number(fd.get('quantityQtxMax')),
      maxPricePerQtx: maxPrice ? toMoney(maxPrice) : undefined,
      requiredQualityGrade: String(fd.get('requiredQualityGrade')),
      requiredCertifications: [] as string[],
      deliveryRegion: String(fd.get('deliveryRegion')),
      neededBy: new Date(String(fd.get('neededBy'))),
      description: fd.get('description') ? String(fd.get('description')) : undefined,
    };

    const res = await createRfq(payload);
    setStatus('idle');
    if (!res.success) {
      setError(res.error);
      return;
    }
    setMatches(res.data.matches);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          {t('rfq.new')}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t('rfq.subtitle')}</p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
          >
            {error && (
              <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-sm)]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('common.product')}>
                <select name="productCategory" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    {t('profile.selectProducts')}
                  </option>
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>
                      {t(`products.${p}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('listing.variety')}>
                <input name="productVariety" type="text" maxLength={100} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('rfq.quantityMin')}>
                <input
                  name="quantityQtxMin"
                  type="number"
                  min="1"
                  step="1"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label={t('rfq.quantityMax')}>
                <input
                  name="quantityQtxMax"
                  type="number"
                  min="1"
                  step="1"
                  required
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('rfq.requiredGrade')}>
                <select name="requiredQualityGrade" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    {t('common.grade')}
                  </option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {t(`grades.${g}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`${t('rfq.maxPrice')} (${t('common.mad')})`}>
                <input name="maxPrice" type="number" min="0" step="0.01" className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('rfq.deliveryRegion')}>
                <select name="deliveryRegion" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    {t('profile.selectRegion')}
                  </option>
                  {MoroccanRegions.map((r) => (
                    <option key={r} value={r}>
                      {t(`regions.${r}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('rfq.neededBy')}>
                <input name="neededBy" type="date" required className={inputClass} />
              </Field>
            </div>

            <Field label={t('listing.description')}>
              <textarea
                name="description"
                rows={3}
                maxLength={2000}
                className={`${inputClass} h-auto py-2`}
              />
            </Field>

            <Button type="submit" loading={status === 'saving'}>
              {t('rfq.submitCta')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {matches && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[var(--color-foreground)]">
            {t('rfq.matchesTitle')}
          </h2>
          <MatchList matches={matches} locale={locale} />
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}
