'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { adminVerifyCertification } from '@/server/certifications';
import type { PendingCertification } from '@mawsim/verification';
import { useState } from 'react';

const TYPE_LABELS: Record<string, string> = {
  organic: 'Agriculture biologique',
  global_gap: 'GlobalGAP',
  label_maroc: 'Label Maroc',
  fair_trade: 'Commerce équitable',
  other: 'Autre',
};

interface CertificationsQueueProps {
  initialCerts: PendingCertification[];
}

export function CertificationsQueue({ initialCerts }: CertificationsQueueProps) {
  const [certs, setCerts] = useState(initialCerts);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});

  async function handle(certId: string, status: 'approved' | 'rejected') {
    setLoading((p) => ({ ...p, [certId]: true }));
    setError((p) => ({ ...p, [certId]: '' }));
    const res = await adminVerifyCertification({
      certificationId: certId,
      status,
      note: notes[certId],
    });
    setLoading((p) => ({ ...p, [certId]: false }));
    if (res.success) {
      setCerts((p) => p.filter((c) => c.id !== certId));
    } else {
      setError((p) => ({ ...p, [certId]: res.error }));
    }
  }

  if (certs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-[var(--color-muted)]">
          Aucune certification en attente de vérification.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {certs.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-[var(--color-foreground)]">{cert.farmName}</h2>
                <p className="text-sm text-[var(--color-muted)] mt-0.5">
                  {TYPE_LABELS[cert.type] ?? cert.type} · Émis par {cert.issuedBy}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  Valide jusqu'au{' '}
                  {new Date(cert.validUntil).toLocaleDateString('fr-MA', { dateStyle: 'long' })}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Soumis le{' '}
                  {new Date(cert.createdAt).toLocaleDateString('fr-MA', { dateStyle: 'medium' })}
                </p>
                {/* Document key shown as reference — R2 signed URL would go here */}
                <p className="text-xs font-mono text-[var(--color-muted)] mt-1">
                  Doc: {cert.documentKey}
                </p>
              </div>
            </div>

            <textarea
              value={notes[cert.id] ?? ''}
              onChange={(e) => setNotes((p) => ({ ...p, [cert.id]: e.target.value }))}
              placeholder="Note admin (optionnelle — visible en cas de rejet)"
              rows={2}
              maxLength={500}
              className="w-full text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />

            {error[cert.id] && (
              <p className="text-sm text-[var(--color-danger)]">{error[cert.id]}</p>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => handle(cert.id, 'approved')}
                disabled={loading[cert.id]}
                className="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90"
              >
                {loading[cert.id] ? '…' : '✓ Approuver'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handle(cert.id, 'rejected')}
                disabled={loading[cert.id]}
                className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5"
              >
                {loading[cert.id] ? '…' : '✗ Rejeter'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
