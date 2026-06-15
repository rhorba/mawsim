'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/i18n/navigation';
import { createListing, publishListing } from '@/server/listing';
import { MoroccanRegions, toMoney } from '@mawsim/core';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

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

export function ListingForm() {
  const t = useTranslations();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handle(publish: boolean) {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    const fd = new FormData(form);
    setError(null);
    setStatus('saving');

    const payload = {
      productCategory: String(fd.get('productCategory')),
      productVariety: fd.get('productVariety') ? String(fd.get('productVariety')) : undefined,
      quantityQtx: Number(fd.get('quantityQtx')),
      qualityGrade: String(fd.get('qualityGrade')),
      askPricePerQtx: toMoney(Number(fd.get('askPrice'))),
      minOrderQtx: Number(fd.get('minOrderQtx')),
      harvestDate: fd.get('harvestDate') ? new Date(String(fd.get('harvestDate'))) : undefined,
      availableUntil: new Date(String(fd.get('availableUntil'))),
      region: String(fd.get('region')),
      description: fd.get('description') ? String(fd.get('description')) : undefined,
    };

    const res = await createListing(payload);
    if (!res.success) {
      setStatus('idle');
      setError(res.error);
      return;
    }
    if (publish) {
      const pub = await publishListing(res.data.id);
      if (!pub.success) {
        setStatus('idle');
        setError(pub.error);
        return;
      }
    }
    router.push('/farmer/listings');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          {t('listing.new')}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t('postListing.subtitle')}</p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form ref={formRef} className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
              <Field label={t('common.region')}>
                <select name="region" required defaultValue="" className={inputClass}>
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
              <Field label={t('common.grade')}>
                <select name="qualityGrade" required defaultValue="" className={inputClass}>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t('listing.quantity')}>
                <input
                  name="quantityQtx"
                  type="number"
                  min="1"
                  step="1"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label={t('listing.minOrder')}>
                <input
                  name="minOrderQtx"
                  type="number"
                  min="1"
                  step="1"
                  required
                  defaultValue="1"
                  className={inputClass}
                />
              </Field>
              <Field label={`${t('listing.askPrice')} (${t('common.mad')})`}>
                <input
                  name="askPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('listing.harvestDate')}>
                <input name="harvestDate" type="date" className={inputClass} />
              </Field>
              <Field label={t('listing.availableUntil')}>
                <input name="availableUntil" type="date" required className={inputClass} />
              </Field>
            </div>

            <Field label={t('listing.description')}>
              <textarea
                name="description"
                rows={4}
                maxLength={2000}
                className={`${inputClass} h-auto py-2`}
              />
            </Field>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" loading={status === 'saving'} onClick={() => handle(true)}>
                {t('listing.publishCta')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={status === 'saving'}
                onClick={() => handle(false)}
              >
                {t('listing.draftCta')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
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
