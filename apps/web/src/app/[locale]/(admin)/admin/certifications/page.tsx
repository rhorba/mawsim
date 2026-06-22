import { CertificationsQueue } from '@/components/admin/certifications-queue';
import { getAdminPendingCertifications } from '@/server/certifications';

export const dynamic = 'force-dynamic';

export default async function AdminCertificationsPage() {
  const certs = await getAdminPendingCertifications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
          File de vérification — Certifications
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {certs.length} certification{certs.length !== 1 ? 's' : ''} en attente
        </p>
      </div>

      <CertificationsQueue initialCerts={certs} />
    </div>
  );
}
