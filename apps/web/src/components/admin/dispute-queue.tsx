'use client';

import { Button } from '@/components/ui/button';
import { resolveDispute } from '@/server/admin';
import type { AdminDealRow } from '@/server/admin';
import { formatMAD } from '@mawsim/core';
import { useState } from 'react';

interface DisputeQueueProps {
  initialDisputes: AdminDealRow[];
}

export function DisputeQueue({ initialDisputes }: DisputeQueueProps) {
  const [disputes, setDisputes] = useState(initialDisputes);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (disputes.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)] py-8 text-center">Aucun litige en cours.</p>
    );
  }

  async function handleResolve(dealId: string, resolution: 'complete' | 'cancel') {
    setLoading((prev) => ({ ...prev, [dealId]: true }));
    setErrors((prev) => ({ ...prev, [dealId]: '' }));

    const res = await resolveDispute({ dealId, resolution, adminNote: notes[dealId] || undefined });

    setLoading((prev) => ({ ...prev, [dealId]: false }));
    if (res.success) {
      setDisputes((prev) => prev.filter((d) => d.id !== dealId));
    } else {
      setErrors((prev) => ({ ...prev, [dealId]: res.error }));
    }
  }

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <div
          key={dispute.id}
          className="bg-[var(--color-surface)] border border-red-200 rounded-[var(--radius-lg)] p-5 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">
                {dispute.farmName} → {dispute.companyName}
              </p>
              <p className="text-sm text-[var(--color-muted)] mt-0.5">
                {dispute.productCategory}
                {dispute.productVariety ? ` — ${dispute.productVariety}` : ''} •{' '}
                {dispute.quantityQtx.toLocaleString('fr-MA')} qtx
              </p>
            </div>
            <div className="text-end">
              <p className="font-bold text-[var(--color-primary)]">
                {formatMAD(dispute.totalAmount)}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {new Date(dispute.createdAt).toLocaleDateString('fr-MA')}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor={`note-${dispute.id}`}
              className="block text-xs font-medium text-[var(--color-muted)] mb-1"
            >
              Note admin (optionnel)
            </label>
            <textarea
              id={`note-${dispute.id}`}
              value={notes[dispute.id] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
              maxLength={500}
              rows={2}
              className="w-full text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-bg)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {errors[dispute.id] && (
            <p className="text-sm text-[var(--color-danger)]">{errors[dispute.id]}</p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => handleResolve(dispute.id, 'complete')}
              disabled={loading[dispute.id]}
              className="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90"
            >
              {loading[dispute.id] ? 'Traitement…' : 'Clôturer (terminé)'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleResolve(dispute.id, 'cancel')}
              disabled={loading[dispute.id]}
              className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-red-50"
            >
              Annuler
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
