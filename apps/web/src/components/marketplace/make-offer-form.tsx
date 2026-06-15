'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from '@/i18n/navigation';
import { makeOfferOnListing } from '@/server/negotiation';
import { toMoney } from '@mawsim/core';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

const inputClass =
  'w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';
const labelClass = 'text-sm font-medium text-[var(--color-foreground)]';

export function MakeOfferForm({
  listingId,
  defaultQuantity,
  defaultPrice,
}: {
  listingId: string;
  defaultQuantity: number;
  defaultPrice: number; // centimes — listing ask, used to prefill MAD
}) {
  const t = useTranslations();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    const fd = new FormData(form);
    setError(null);
    setSaving(true);

    const res = await makeOfferOnListing({
      listingId,
      pricePerQtx: toMoney(Number(fd.get('price'))),
      quantityQtx: Number(fd.get('quantity')),
      deliveryDate: new Date(String(fd.get('deliveryDate'))),
      message: fd.get('message') ? String(fd.get('message')) : undefined,
    });

    if (!res.success) {
      setSaving(false);
      setError(res.error);
      return;
    }
    router.push(`/buyer/deals/${res.data.deal.id}`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form ref={formRef} className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {error && (
            <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-sm)]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <span className={labelClass}>{t('deal.offerPrice')}</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={(defaultPrice / 100).toString()}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5 block">
              <span className={labelClass}>{t('deal.offerQuantity')}</span>
              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={defaultQuantity.toString()}
                className={inputClass}
              />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className={labelClass}>{t('deal.deliveryDateLabel')}</span>
            <input name="deliveryDate" type="date" required className={inputClass} />
          </label>

          <label className="space-y-1.5 block">
            <span className={labelClass}>{t('deal.offerMessage')}</span>
            <textarea
              name="message"
              rows={3}
              maxLength={1000}
              className={`${inputClass} h-auto py-2`}
            />
          </label>

          <Button type="button" loading={saving} onClick={submit}>
            {t('deal.sendOffer')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
