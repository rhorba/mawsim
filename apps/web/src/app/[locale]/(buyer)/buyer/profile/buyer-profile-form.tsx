'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { requestBusinessVerification, upsertBuyerProfile } from '@/server/buyer-profile';
import type { BuyerProfileRecord } from '@/server/profile-types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const SECTORS = [
  { value: 'processor', key: 'sectorProcessor' },
  { value: 'exporter', key: 'sectorExporter' },
  { value: 'distributor', key: 'sectorDistributor' },
  { value: 'chr', key: 'sectorChr' },
  { value: 'cooperative', key: 'sectorCooperative' },
  { value: 'other', key: 'sectorOther' },
] as const;

const inputClass =
  'w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow';
const labelClass = 'text-sm font-medium text-[var(--color-foreground)]';

export function BuyerProfileForm({ profile }: { profile: BuyerProfileRecord | null }) {
  const t = useTranslations('profile');
  const tBuyer = useTranslations('buyer');
  const tCommon = useTranslations('common');

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [verified] = useState<boolean>(profile?.verifiedBusiness ?? false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setStatus('saving');
    const form = new FormData(e.currentTarget);

    const res = await upsertBuyerProfile({
      companyName: String(form.get('companyName') ?? ''),
      ice: form.get('ice') ? String(form.get('ice')) : undefined,
      rc: form.get('rc') ? String(form.get('rc')) : undefined,
      sector: String(form.get('sector') ?? ''),
      city: String(form.get('city') ?? ''),
    });

    if (res.success) {
      setStatus('saved');
    } else {
      setStatus('error');
      setErrorMsg(t('saveError'));
    }
  }

  async function handleVerify() {
    setVerifyMsg(null);
    const res = await requestBusinessVerification();
    if (res.success && res.data.submitted) {
      setVerifyMsg(t('verificationSubmitted'));
    } else {
      setVerifyMsg(t('verificationNeedsIce'));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] font-[var(--font-display)]">
          {t('buyerTitle')}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t('buyerSubtitle')}</p>
      </header>

      {profile && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full',
                  verified
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-secondary)]'
                    : 'bg-[var(--color-bg)] text-[var(--color-muted)]'
                )}
              >
                {verified ? t('verifiedBusiness') : t('unverifiedBusiness')}
              </span>
              {verifyMsg && <span className="text-sm text-[var(--color-muted)]">{verifyMsg}</span>}
            </div>
            {!verified && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void handleVerify();
                }}
              >
                {t('requestVerification')}
              </Button>
            )}
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
              <label htmlFor="companyName" className={labelClass}>
                {tBuyer('companyName')}
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                minLength={2}
                defaultValue={profile?.companyName ?? ''}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="ice" className={labelClass}>
                  {tBuyer('ice')}
                </label>
                <input
                  id="ice"
                  name="ice"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{15}"
                  placeholder="000000000000000"
                  defaultValue={profile?.ice ?? ''}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="rc" className={labelClass}>
                  {tBuyer('rc')}
                </label>
                <input
                  id="rc"
                  name="rc"
                  type="text"
                  defaultValue={profile?.rc ?? ''}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="sector" className={labelClass}>
                  {tBuyer('sector')}
                </label>
                <select
                  id="sector"
                  name="sector"
                  required
                  defaultValue={profile?.sector ?? ''}
                  className={inputClass}
                >
                  <option value="" disabled>
                    {t('selectSector')}
                  </option>
                  {SECTORS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {tBuyer(s.key)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="city" className={labelClass}>
                  {tCommon('region')}
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  minLength={2}
                  defaultValue={profile?.city ?? ''}
                  className={inputClass}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" loading={status === 'saving'}>
              {tCommon('save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
