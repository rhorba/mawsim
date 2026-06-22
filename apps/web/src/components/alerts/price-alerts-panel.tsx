'use client';

import { Button } from '@/components/ui/button';
import { createAlert, deleteAlert } from '@/server/price-alerts';
import type { priceAlerts } from '@mawsim/db/schema';
import { useState, useTransition } from 'react';

type AlertRecord = typeof priceAlerts.$inferSelect;

const PRODUCT_OPTIONS = [
  { value: 'cereals', label: 'Céréales' },
  { value: 'olives', label: 'Olives' },
  { value: 'dates', label: 'Dattes' },
  { value: 'citrus', label: 'Agrumes' },
  { value: 'vegetables', label: 'Légumes' },
  { value: 'argan', label: 'Argan' },
  { value: 'legumes', label: 'Légumineuses' },
] as const;

const REGION_OPTIONS = [
  'Fès-Meknès',
  'Souss-Massa',
  'Marrakech-Safi',
  'Drâa-Tafilalet',
  'Casablanca-Settat',
  'Rabat-Salé-Kénitra',
  'Tanger-Tétouan-Al Hoceïma',
  'Gharb-Chrarda-Béni Hssen',
  'Oriental',
  'Béni Mellal-Khénifra',
];

function formatPrice(centimes: number): string {
  return (centimes / 100).toLocaleString('fr-MA', { maximumFractionDigits: 0 });
}

function AlertRow({ alert, onDelete }: { alert: AlertRecord; onDelete: (id: string) => void }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--color-border)] last:border-0">
      <div>
        <p className="text-sm font-medium text-[var(--color-foreground)]">
          {alert.productVariety ?? alert.productCategory} · {alert.region}
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          Alerte <strong>{alert.direction === 'above' ? 'au-dessus de' : 'en dessous de'}</strong>{' '}
          {formatPrice(alert.thresholdPricePerQtx)} MAD/qtx
          {alert.lastTriggeredAt && (
            <span className="ml-2">
              · Dernier déclenchement :{' '}
              {new Date(alert.lastTriggeredAt).toLocaleDateString('fr-MA', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await deleteAlert(alert.id);
            if (res.success) onDelete(alert.id);
          })
        }
      >
        {pending ? '…' : 'Supprimer'}
      </Button>
    </div>
  );
}

function CreateAlertForm({ onCreated: _onCreated }: { onCreated: (alert: AlertRecord) => void }) {
  const [category, setCategory] = useState('cereals');
  const [variety, setVariety] = useState('');
  const [region, setRegion] = useState(REGION_OPTIONS[0] ?? '');
  const [threshold, setThreshold] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    const mad = Number.parseFloat(threshold);
    if (Number.isNaN(mad) || mad <= 0) {
      setError('Entrez un seuil de prix valide.');
      return;
    }
    setError(null);
    start(async () => {
      const res = await createAlert({
        productCategory: category as 'cereals',
        ...(variety ? { productVariety: variety } : {}),
        region,
        thresholdPricePerQtx: Math.round(mad * 100),
        direction,
      });
      if (res.success) {
        // Reload page to show new alert
        window.location.reload();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-3 bg-[var(--color-bg)]">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">Nouvelle alerte prix</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div>
          <label
            htmlFor="alert-category"
            className="block text-xs text-[var(--color-muted)] mb-0.5"
          >
            Produit
          </label>
          <select
            id="alert-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-sm bg-white"
          >
            {PRODUCT_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="alert-variety" className="block text-xs text-[var(--color-muted)] mb-0.5">
            Variété (optionnel)
          </label>
          <input
            id="alert-variety"
            type="text"
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-sm"
            placeholder="ex. Blé dur"
          />
        </div>
        <div>
          <label htmlFor="alert-region" className="block text-xs text-[var(--color-muted)] mb-0.5">
            Région
          </label>
          <select
            id="alert-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-sm bg-white"
          >
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="alert-threshold"
            className="block text-xs text-[var(--color-muted)] mb-0.5"
          >
            Seuil (MAD/qtx)
          </label>
          <input
            id="alert-threshold"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-sm"
            placeholder="450"
          />
        </div>
        <div>
          <label
            htmlFor="alert-direction"
            className="block text-xs text-[var(--color-muted)] mb-0.5"
          >
            Condition
          </label>
          <select
            id="alert-direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
            className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-sm bg-white"
          >
            <option value="above">Prix au-dessus du seuil</option>
            <option value="below">Prix en dessous du seuil</option>
          </select>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button size="sm" onClick={submit} disabled={pending}>
        {pending ? 'Création…' : "Créer l'alerte"}
      </Button>
    </div>
  );
}

export function PriceAlertsPanel({ initialAlerts }: { initialAlerts: AlertRecord[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          Alertes prix
        </h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Soyez notifié quand un prix dépasse votre seuil.
        </p>
      </div>

      <CreateAlertForm onCreated={(a) => setAlerts((prev) => [a, ...prev])} />

      {alerts.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Aucune alerte active.</p>
      ) : (
        <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <div className="px-4">
            {alerts.map((a) => (
              <AlertRow
                key={a.id}
                alert={a}
                onDelete={(id) => setAlerts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
