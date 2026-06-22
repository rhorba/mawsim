'use client';

import { Button } from '@/components/ui/button';
import { addOniclPrice } from '@/server/admin';
import { useState } from 'react';

const CATEGORIES = [
  { value: 'cereals', label: 'Céréales' },
  { value: 'olives', label: 'Olives' },
  { value: 'dates', label: 'Dattes' },
  { value: 'citrus', label: 'Agrumes' },
  { value: 'vegetables', label: 'Légumes' },
  { value: 'argan', label: 'Argan' },
  { value: 'legumes', label: 'Légumineuses' },
  { value: 'other', label: 'Autre' },
] as const;

const REGIONS = [
  'Gharb-Chrarda-Béni Hssen',
  'Souss-Massa',
  'Meknès-Tafilalet',
  'Marrakech-Safi',
  'Drâa-Tafilalet',
  'Oriental',
  'Béni Mellal-Khénifra',
  'Casablanca-Settat',
  'Rabat-Salé-Kénitra',
  'Laâyoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab',
  'Fès-Meknès',
  'Tanger-Tétouan-Al Hoceïma',
  'National',
];

export function AddPriceForm({ onAdded }: { onAdded?: () => void }) {
  const [category, setCategory] = useState('cereals');
  const [variety, setVariety] = useState('');
  const [region, setRegion] = useState(REGIONS[0] ?? '');
  const [price, setPrice] = useState('');
  const [source, setSource] = useState<'onicl' | 'admin_manual'>('onicl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = Number.parseInt(price, 10);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Prix invalide.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await addOniclPrice({
      productCategory: category,
      ...(variety ? { productVariety: variety } : {}),
      region,
      pricePerQtx: priceNum,
      source,
    });

    setLoading(false);
    if (res.success) {
      setSuccess('Prix ajouté avec succès.');
      setPrice('');
      setVariety('');
      onAdded?.();
    } else {
      setError(res.error);
    }
  }

  const inputCls =
    'w-full text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="ap-category"
            className="block text-xs font-medium text-[var(--color-muted)] mb-1"
          >
            Produit
          </label>
          <select
            id="ap-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="ap-variety"
            className="block text-xs font-medium text-[var(--color-muted)] mb-1"
          >
            Variété (optionnel)
          </label>
          <input
            id="ap-variety"
            type="text"
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            maxLength={100}
            placeholder="ex: Blé dur Karim"
            className={inputCls}
          />
        </div>

        <div>
          <label
            htmlFor="ap-region"
            className="block text-xs font-medium text-[var(--color-muted)] mb-1"
          >
            Région
          </label>
          <select
            id="ap-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputCls}
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="ap-price"
            className="block text-xs font-medium text-[var(--color-muted)] mb-1"
          >
            Prix (MAD/quintal — en centimes)
          </label>
          <input
            id="ap-price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="1"
            placeholder="ex: 35000 (= 350 MAD)"
            className={inputCls}
          />
          {price && !Number.isNaN(Number.parseInt(price, 10)) && (
            <p className="text-xs text-[var(--color-muted)] mt-1">
              = {(Number.parseInt(price, 10) / 100).toFixed(2)} MAD/quintal
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="ap-source"
            className="block text-xs font-medium text-[var(--color-muted)] mb-1"
          >
            Source
          </label>
          <select
            id="ap-source"
            value={source}
            onChange={(e) => setSource(e.target.value as 'onicl' | 'admin_manual')}
            className={inputCls}
          >
            <option value="onicl">ONICL (référence officielle)</option>
            <option value="admin_manual">Saisie manuelle admin</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {success && <p className="text-sm text-[var(--color-secondary)] font-medium">✓ {success}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Ajout…' : 'Ajouter le prix'}
      </Button>
    </form>
  );
}
