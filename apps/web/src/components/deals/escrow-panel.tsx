'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { confirmDelivery, fundDeposit, markInTransit } from '@/server/escrow';
import { formatMAD } from '@mawsim/core';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

export type EscrowBreakdown = {
  grossAmount: number; // centimes
  deposit: number; // 30%
  remainder: number; // 70%
  platformFeeFromBuyer: number; // 2.5%
  platformFeeFromFarmer: number; // 1.5%
  farmerPayout: number;
};

type Props = {
  dealId: string;
  dealStatus: string;
  viewerSide: 'farmer' | 'buyer' | 'admin';
  /** null until the buyer funds the deposit. */
  escrowStatus: string | null;
  breakdown: EscrowBreakdown;
  locale: 'fr' | 'ar';
  myConfirmed: boolean;
  theirConfirmed: boolean;
};

export function EscrowPanel({
  dealId,
  dealStatus,
  viewerSide,
  escrowStatus,
  breakdown,
  locale,
  myConfirmed,
  theirConfirmed,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  const m = formatMAD;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-[var(--color-foreground)]">
        {t('deal.escrow.title')}
      </h2>

      {error && (
        <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-sm)]">
          {error}
        </div>
      )}

      {/* Breakdown — 30/70 split + transparent 4% commission */}
      <dl className="rounded-[var(--radius-md)] border border-[var(--color-border)] divide-y divide-[var(--color-border)] text-sm">
        <Row label={t('deal.escrow.gross')} value={m(breakdown.grossAmount, locale)} />
        <Row
          label={`${t('deal.escrow.deposit')} (30%)`}
          value={m(breakdown.deposit, locale)}
          done={
            escrowStatus === 'deposit_paid' ||
            escrowStatus === 'fully_funded' ||
            escrowStatus === 'released'
          }
          doneLabel={t('deal.escrow.paid')}
        />
        <Row
          label={`${t('deal.escrow.remainder')} (70%)`}
          value={m(breakdown.remainder, locale)}
          done={escrowStatus === 'fully_funded' || escrowStatus === 'released'}
          doneLabel={t('deal.escrow.paid')}
        />
        {viewerSide !== 'buyer' && (
          <Row label={t('deal.escrow.farmerPayout')} value={m(breakdown.farmerPayout, locale)} />
        )}
        <Row
          label={t('deal.escrow.fees')}
          value={m(breakdown.platformFeeFromBuyer + breakdown.platformFeeFromFarmer, locale)}
          hint="4%"
        />
      </dl>

      {/* Step 1 — buyer funds the 30% deposit on the signed contract */}
      {dealStatus === 'contract_signed' && viewerSide === 'buyer' && (
        <Button type="button" loading={pending} onClick={() => run(() => fundDeposit(dealId))}>
          {t('deal.escrow.fundDepositCta', { amount: m(breakdown.deposit, locale) })}
        </Button>
      )}
      {dealStatus === 'contract_signed' && viewerSide === 'farmer' && (
        <p className="text-sm text-[var(--color-muted)]">{t('deal.escrow.awaitingDeposit')}</p>
      )}

      {/* Step 2 — farmer dispatches the goods once deposit is in escrow */}
      {dealStatus === 'escrow_funded' && viewerSide === 'farmer' && (
        <Button type="button" loading={pending} onClick={() => run(() => markInTransit(dealId))}>
          {t('deal.escrow.dispatchCta')}
        </Button>
      )}
      {dealStatus === 'escrow_funded' && viewerSide === 'buyer' && (
        <p className="text-sm text-[var(--color-muted)]">{t('deal.escrow.awaitingDispatch')}</p>
      )}

      {/* Step 3 — dual delivery confirmation releases the remainder */}
      {dealStatus === 'in_transit' && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-foreground)]">
            {myConfirmed ? t('deal.escrow.youConfirmed') : t('deal.escrow.confirmPrompt')}
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            {theirConfirmed
              ? t('deal.escrow.counterpartyConfirmed')
              : t('deal.escrow.counterpartyPending')}
          </p>
          {!myConfirmed && viewerSide !== 'admin' && (
            <Button
              type="button"
              loading={pending}
              onClick={() => run(() => confirmDelivery(dealId))}
            >
              {t('deal.escrow.confirmDeliveryCta')}
            </Button>
          )}
        </div>
      )}

      {/* Settled */}
      {dealStatus === 'completed' && (
        <div className="text-sm text-[var(--color-secondary)] bg-[var(--color-primary-light)] px-3 py-2 rounded-[var(--radius-sm)]">
          {t('deal.escrow.released', { payout: m(breakdown.farmerPayout, locale) })}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  done,
  doneLabel,
  hint,
}: {
  label: string;
  value: string;
  done?: boolean;
  doneLabel?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <dt className="text-[var(--color-muted)]">
        {label}
        {hint && <span className="ml-1 text-xs">({hint})</span>}
      </dt>
      <dd className="flex items-center gap-2 font-medium tabular-nums text-[var(--color-foreground)]">
        {value}
        {done && (
          <span className="text-xs font-semibold text-[var(--color-secondary)]">✓ {doneLabel}</span>
        )}
      </dd>
    </div>
  );
}
