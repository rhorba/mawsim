'use client';

import { Button } from '@/components/ui/button';
import {
  type LogisticsRequestRecord,
  type LogisticsRequestWithQuotes,
  submitLogisticsQuote,
} from '@/server/logistics';
import { useState, useTransition } from 'react';

function formatPrice(centimes: number): string {
  return (centimes / 100).toLocaleString('fr-MA', { maximumFractionDigits: 0 });
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  quoted: 'Devis reçus',
  assigned: 'Assigné',
  in_transit: 'En transit',
  delivered: 'Livré',
};

const TRUCK_LABELS: Record<string, string> = {
  standard: 'Camion standard',
  refrigerated: 'Camion réfrigéré',
  bulk: 'Vrac',
};

// ---------------------------------------------------------------------------
// Quote submission form (embedded in open request row)
// ---------------------------------------------------------------------------
function QuoteForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const [price, setPrice] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const priceCentimes = Math.round(Number.parseFloat(price) * 100);
    if (!priceCentimes || !availableFrom) {
      setError('Prix et date de disponibilité requis.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitLogisticsQuote({
        requestId,
        priceQuoted: priceCentimes,
        availableFrom: new Date(availableFrom),
        message: message || undefined,
      });
      if (res.success) {
        onDone();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mt-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg space-y-2">
      <p className="text-xs font-semibold text-[var(--color-foreground)]">Soumettre un devis</p>
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-32">
          <label htmlFor="quote-price" className="block text-xs text-[var(--color-muted)] mb-0.5">
            Prix total (MAD)
          </label>
          <input
            id="quote-price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            placeholder="ex. 2500"
          />
        </div>
        <div className="flex-1 min-w-32">
          <label
            htmlFor="quote-available-from"
            className="block text-xs text-[var(--color-muted)] mb-0.5"
          >
            Disponible à partir du
          </label>
          <input
            id="quote-available-from"
            type="date"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>
        <div className="flex-1 min-w-48">
          <label htmlFor="quote-message" className="block text-xs text-[var(--color-muted)] mb-0.5">
            Message (optionnel)
          </label>
          <input
            id="quote-message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            placeholder="Disponible, camion conforme…"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button size="sm" onClick={submit} disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer le devis'}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Open request card (logistics provider sees these)
// ---------------------------------------------------------------------------
function OpenRequestCard({
  req,
  onQuoteSubmitted,
}: {
  req: LogisticsRequestWithQuotes;
  onQuoteSubmitted: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              {req.productCategory}
            </span>
            <span className="text-xs text-[var(--color-muted)]">•</span>
            <span className="text-xs text-[var(--color-muted)]">{TRUCK_LABELS[req.truckType]}</span>
            {req.urgent && (
              <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                Urgent
              </span>
            )}
          </div>
          <p className="font-medium text-[var(--color-foreground)]">
            {req.originRegion} → {req.destinationRegion}
          </p>
          <p className="text-sm text-[var(--color-muted)] mt-0.5">
            {req.weightTonnes} t — Chargement :{' '}
            {new Date(req.pickupDate).toLocaleDateString('fr-MA', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            {req.farmerFarmName} → {req.buyerCompanyName}
          </p>
        </div>
        <div className="text-end">
          <span className="text-xs text-[var(--color-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-0.5 rounded">
            {STATUS_LABELS[req.status]}
          </span>
          {req.quotes.length > 0 && (
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {req.quotes.length} devis reçu{req.quotes.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {!showForm ? (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
          Soumettre un devis
        </Button>
      ) : (
        <QuoteForm
          requestId={req.id}
          onDone={() => {
            setShowForm(false);
            onQuoteSubmitted();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// My jobs (assigned requests where I'm the provider)
// ---------------------------------------------------------------------------
function MyJobCard({ req }: { req: LogisticsRequestRecord }) {
  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-[var(--color-foreground)]">
            {req.originRegion} → {req.destinationRegion}
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            {req.productCategory} · {req.weightTonnes} t
          </p>
          {req.agreedPrice && (
            <p className="text-sm font-semibold text-[var(--color-primary)] mt-1">
              {formatPrice(req.agreedPrice)} MAD
            </p>
          )}
        </div>
        <span className="text-xs font-medium text-[var(--color-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-0.5 rounded">
          {STATUS_LABELS[req.status]}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
export function LogisticsProviderDashboard({
  openRequests,
  myJobs,
}: {
  openRequests: LogisticsRequestWithQuotes[];
  myJobs: LogisticsRequestRecord[];
}) {
  const [, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      {/* Open requests */}
      <section>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)] mb-1">
          Tableau de bord transporteur
        </h1>
        <p className="text-[var(--color-muted)] text-sm mb-4">
          Demandes de transport ouvertes. Soumettez vos devis directement.
        </p>

        {openRequests.length === 0 ? (
          <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-[var(--color-muted)]">Aucune demande ouverte pour le moment.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {openRequests.map((req) => (
              <OpenRequestCard
                key={req.id}
                req={req}
                onQuoteSubmitted={() => setRefreshKey((k) => k + 1)}
              />
            ))}
          </div>
        )}
      </section>

      {/* My assigned jobs */}
      {myJobs.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-[var(--color-foreground)] mb-3">
            Mes transports assignés
          </h2>
          <div className="grid gap-3">
            {myJobs.map((job) => (
              <MyJobCard key={job.id} req={job} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
