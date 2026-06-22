'use client';

import { Button } from '@/components/ui/button';
import {
  type LogisticsQuoteRecord,
  type LogisticsRequestRecord,
  acceptLogisticsQuote,
  createLogisticsRequest,
} from '@/server/logistics';
import { useTransition } from 'react';

function formatPrice(centimes: number): string {
  return (centimes / 100).toLocaleString('fr-MA', { maximumFractionDigits: 0 });
}

const STATUS_LABELS: Record<string, string> = {
  open: 'En attente de devis',
  quoted: 'Devis reçus',
  assigned: 'Transporteur assigné',
  in_transit: 'En transit',
  delivered: 'Livré',
};

function QuoteRow({
  quote,
  canAccept,
}: {
  quote: LogisticsQuoteRecord;
  canAccept: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div
      className={`flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)] last:border-0 ${
        quote.accepted ? 'bg-emerald-50/50' : ''
      }`}
    >
      <div>
        <p className="text-sm font-medium text-[var(--color-foreground)]">
          {formatPrice(quote.priceQuoted)} MAD
          {quote.accepted && (
            <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              Accepté
            </span>
          )}
        </p>
        {quote.availableFrom && (
          <p className="text-xs text-[var(--color-muted)]">
            Disponible :{' '}
            {new Date(quote.availableFrom).toLocaleDateString('fr-MA', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        )}
        {quote.message && (
          <p className="text-xs text-[var(--color-muted)] italic">{quote.message}</p>
        )}
      </div>
      {canAccept && !quote.accepted && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await acceptLogisticsQuote(quote.id);
            })
          }
        >
          {pending ? 'Acceptation…' : 'Accepter'}
        </Button>
      )}
    </div>
  );
}

export function LogisticsPanel({
  dealId,
  dealStatus,
  viewerSide,
  logisticsRequest,
  quotes,
}: {
  dealId: string;
  dealStatus: string;
  viewerSide: 'farmer' | 'buyer' | 'admin';
  logisticsRequest: LogisticsRequestRecord | null;
  quotes: LogisticsQuoteRecord[];
}) {
  const [pending, start] = useTransition();

  const canCreate =
    !logisticsRequest && (dealStatus === 'escrow_funded' || dealStatus === 'in_transit');
  const canAcceptQuote = viewerSide === 'farmer' || viewerSide === 'admin';

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--color-foreground)]">Logistique</h3>

      {!logisticsRequest && !canCreate && (
        <p className="text-sm text-[var(--color-muted)]">
          La demande de transport sera générée automatiquement une fois le contrat financé.
        </p>
      )}

      {canCreate && (
        <div className="flex items-center justify-between gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Aucune demande de transport active. Créez-en une pour trouver un transporteur.
          </p>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await createLogisticsRequest(dealId);
              })
            }
          >
            {pending ? 'Création…' : 'Créer la demande'}
          </Button>
        </div>
      )}

      {logisticsRequest && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {logisticsRequest.originRegion} → {logisticsRequest.destinationRegion}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {logisticsRequest.weightTonnes} t ·{' '}
                {logisticsRequest.truckType === 'refrigerated'
                  ? 'Camion réfrigéré'
                  : logisticsRequest.truckType === 'bulk'
                    ? 'Vrac'
                    : 'Camion standard'}
              </p>
            </div>
            <span className="text-xs font-medium text-[var(--color-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-0.5 rounded">
              {STATUS_LABELS[logisticsRequest.status] ?? logisticsRequest.status}
            </span>
          </div>

          {logisticsRequest.agreedPrice && (
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              Prix convenu : {formatPrice(logisticsRequest.agreedPrice)} MAD
            </p>
          )}

          {/* Quotes list */}
          {quotes.length > 0 && (
            <div className="mt-2 border border-[var(--color-border)] rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                <p className="text-xs font-semibold text-[var(--color-foreground)]">
                  Devis reçus ({quotes.length})
                </p>
              </div>
              <div className="px-3">
                {quotes.map((q) => (
                  <QuoteRow
                    key={q.id}
                    quote={q}
                    canAccept={canAcceptQuote && logisticsRequest.status === 'quoted'}
                  />
                ))}
              </div>
            </div>
          )}

          {logisticsRequest.status === 'open' && quotes.length === 0 && (
            <p className="text-xs text-[var(--color-muted)] italic">
              En attente de devis des transporteurs…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
