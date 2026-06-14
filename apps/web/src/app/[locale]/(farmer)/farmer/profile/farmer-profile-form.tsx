'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { upsertFarmerProfile } from '@/server/farmer-profile';
import type { FarmerCertificationRecord, FarmerProfileRecord } from '@/server/profile-types';
import { MoroccanRegions } from '@mawsim/core';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const PRODUCT_CATEGORIES = [
  'cereals',
  'olives',
  'dates',
  'citrus',
  'vegetables',
  'argan',
  'legumes',
  'other',
] as const;

const inputClass =
  'w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow';
const labelClass = 'text-sm font-medium text-[var(--color-foreground)]';

export function FarmerProfileForm({
  profile,
  certifications,
}: {
  profile: FarmerProfileRecord | null;
  certifications: FarmerCertificationRecord[];
}) {
  const t = useTranslations('profile');
  const tFarmer = useTranslations('farmer');
  const tCommon = useTranslations('common');
  const tProducts = useTranslations('products');
  const tRegions = useTranslations('regions');
  const tCertTypes = useTranslations('certTypes');

  const [products, setProducts] = useState<string[]>(profile?.products ?? []);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function toggleProduct(p: string) {
    setProducts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (products.length === 0) {
      setStatus('error');
      setErrorMsg(t('atLeastOneProduct'));
      return;
    }

    setStatus('saving');
    const form = new FormData(e.currentTarget);
    const farmSizeRaw = form.get('farmSizeHa');

    const res = await upsertFarmerProfile({
      farmName: String(form.get('farmName') ?? ''),
      region: String(form.get('region') ?? ''),
      commune: form.get('commune') ? String(form.get('commune')) : undefined,
      farmSizeHa: farmSizeRaw ? Number(farmSizeRaw) : undefined,
      products,
    });

    if (res.success) {
      setStatus('saved');
    } else {
      setStatus('error');
      setErrorMsg(t('saveError'));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] font-[var(--font-display)]">
          {t('farmerTitle')}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t('farmerSubtitle')}</p>
      </header>

      {profile && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
              {t('stats')}
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <Stat label={t('ratingLabel')} value={`★ ${Number(profile.avgRating).toFixed(1)}`} />
              <Stat label={t('dealsLabel')} value={String(profile.completedDeals)} />
              <Stat label={t('reviewsLabel')} value={String(profile.reviewCount)} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-4"
          >
            {status === 'saved' && (
              <div className="text-sm text-[var(--color-secondary)] bg-[var(--color-primary-light)] px-3 py-2 rounded-[var(--radius-sm)]">
                {t('saved')}
              </div>
            )}
            {status === 'error' && errorMsg && (
              <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-sm)]">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="farmName" className={labelClass}>
                {tFarmer('farmName')}
              </label>
              <input
                id="farmName"
                name="farmName"
                type="text"
                required
                minLength={2}
                defaultValue={profile?.farmName ?? ''}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="region" className={labelClass}>
                  {tFarmer('region')}
                </label>
                <select
                  id="region"
                  name="region"
                  required
                  defaultValue={profile?.region ?? ''}
                  className={inputClass}
                >
                  <option value="" disabled>
                    {t('selectRegion')}
                  </option>
                  {MoroccanRegions.map((r) => (
                    <option key={r} value={r}>
                      {tRegions(r)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="commune" className={labelClass}>
                  {t('communeOptional')}
                </label>
                <input
                  id="commune"
                  name="commune"
                  type="text"
                  defaultValue={profile?.commune ?? ''}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="farmSizeHa" className={labelClass}>
                {tFarmer('farmSize')}
              </label>
              <input
                id="farmSizeHa"
                name="farmSizeHa"
                type="number"
                min="0"
                step="0.1"
                defaultValue={profile?.farmSizeHa ?? ''}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <p className={labelClass}>{tFarmer('products')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRODUCT_CATEGORIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProduct(p)}
                    className={cn(
                      'p-2 rounded-[var(--radius-md)] border text-xs font-medium transition-all',
                      products.includes(p)
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-border-strong)]'
                    )}
                  >
                    {tProducts(p)}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" loading={status === 'saving'}>
              {tCommon('save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {t('certifications')}
          </p>
          {certifications.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">{t('noCertifications')}</p>
          ) : (
            <ul className="space-y-2">
              {certifications.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2"
                >
                  <span className="font-medium text-[var(--color-foreground)]">
                    {tCertTypes(c.type)} · {c.issuedBy}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      c.verified
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-secondary)]'
                        : 'bg-[var(--color-bg)] text-[var(--color-muted)]'
                    )}
                  >
                    {c.verified ? t('verified') : t('pending')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[var(--color-muted)]">{t('certUploadNote')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-[var(--color-primary)]">{value}</p>
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
    </div>
  );
}
