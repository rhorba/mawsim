'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { acceptOffer, cancelDeal, counterOffer, signContract } from '@/server/negotiation';
import { toMoney } from '@mawsim/core';
import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';

const inputClass =
  'w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

type Props = {
  dealId: string;
  status: string;
  canRespond: boolean;
  viewerSide: 'farmer' | 'buyer' | 'admin';
  standingPricePerQtx: number; // centimes — for counter prefill
  standingQuantityQtx: number;
};

export function NegotiationPanel({
  dealId,
  status,
  canRespond,
  viewerSide,
  standingPricePerQtx,
  standingQuantityQtx,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isOpen = status === 'offer_made' || status === 'negotiating';
  const isClosed = status === 'cancelled' || status === 'completed';
  const contractAvailable = !isOpen; // agreed and beyond

  function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.success) {
        setError(res.error ?? 'Erreur');
        return;
      }
      router.refresh();
    });
  }

  function sendCounter() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    const fd = new FormData(form);
    run(() =>
      counterOffer({
        dealId,
        pricePerQtx: toMoney(Number(fd.get('price'))),
        quantityQtx: Number(fd.get('quantity')),
        message: fd.get('message') ? String(fd.get('message')) : undefined,
      })
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-sm)]">
          {error}
        </div>
      )}

      {/* Status banners */}
      {status === 'agreed' && (
        <div className="text-sm text-[var(--color-secondary)] bg-[var(--color-primary-light)] px-3 py-2 rounded-[var(--radius-sm)]">
          {t('deal.agreedBanner')}
        </div>
      )}
      {status === 'contract_signed' && (
        <div className="text-sm text-[var(--color-secondary)] bg-[var(--color-primary-light)] px-3 py-2 rounded-[var(--radius-sm)]">
          {t('deal.signedBanner')}
        </div>
      )}
      {isClosed && (
        <div className="text-sm text-[var(--color-muted)] bg-[var(--color-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
          {t('deal.closedBanner')}
        </div>
      )}

      {/* Open negotiation: respond, or wait your turn */}
      {isOpen && canRespond && (
        <form ref={formRef} className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <p className="text-sm font-medium text-[var(--color-primary)]">{t('deal.yourTurn')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium">{t('deal.offerPrice')}</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={(standingPricePerQtx / 100).toString()}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium">{t('deal.offerQuantity')}</span>
              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={standingQuantityQtx.toString()}
                className={inputClass}
              />
            </label>
          </div>
          <textarea
            name="message"
            rows={2}
            maxLength={1000}
            placeholder={t('deal.offerMessage')}
            className={`${inputClass} h-auto py-2`}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" disabled={pending} onClick={sendCounter}>
              {t('deal.counterCta')}
            </Button>
            <Button type="button" loading={pending} onClick={() => run(() => acceptOffer(dealId))}>
              {t('deal.acceptCta')}
            </Button>
          </div>
        </form>
      )}

      {isOpen && !canRespond && (
        <p className="text-sm text-[var(--color-muted)]">{t('deal.waitingCounterparty')}</p>
      )}

      {/* Agreed: buyer signs the contract */}
      {status === 'agreed' && viewerSide === 'buyer' && (
        <Button type="button" loading={pending} onClick={() => run(() => signContract(dealId))}>
          {t('deal.signContractCta')}
        </Button>
      )}

      {/* Contract download once available */}
      {contractAvailable && (
        <a
          href={`/api/deals/${dealId}/contract`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
        >
          ↓ {t('deal.contractDownload')}
        </a>
      )}

      {/* Cancel while still cancellable */}
      {(isOpen || status === 'agreed' || status === 'contract_signed') && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => run(() => cancelDeal(dealId))}
            className="text-[var(--color-danger)]"
          >
            {t('deal.cancelCta')}
          </Button>
        </div>
      )}
    </div>
  );
}
