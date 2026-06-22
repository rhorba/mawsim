// Certification document verification workflow.
// Documents stored in R2 private bucket; served via signed URLs; admin + owner only.

import { db } from '@mawsim/db';
import { farmerCertifications, farmerProfiles } from '@mawsim/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export type CertVerificationStatus = 'pending' | 'approved' | 'rejected';

export type PendingCertification = {
  id: string;
  farmerId: string;
  farmName: string;
  type: string;
  issuedBy: string;
  validUntil: Date;
  documentKey: string;
  createdAt: Date;
};

export async function submitCertification(params: {
  farmerId: string;
  type: 'organic' | 'global_gap' | 'label_maroc' | 'fair_trade' | 'other';
  documentKey: string;
  issuedBy: string;
  validUntil: Date;
}): Promise<string> {
  const [cert] = await db
    .insert(farmerCertifications)
    .values({
      farmerId: params.farmerId,
      type: params.type,
      documentKey: params.documentKey,
      issuedBy: params.issuedBy,
      validUntil: params.validUntil,
      verified: false,
    })
    .returning({ id: farmerCertifications.id });
  if (!cert) throw new Error('Échec de la soumission de la certification.');
  return cert.id;
}

export async function verifyCertification(params: {
  certificationId: string;
  status: 'approved' | 'rejected';
  note?: string;
}): Promise<void> {
  await db
    .update(farmerCertifications)
    .set({
      verified: params.status === 'approved',
      adminNote: params.note ?? null,
    })
    .where(eq(farmerCertifications.id, params.certificationId));
}

/** Returns all certifications pending admin review (not yet verified, no rejection note). */
export async function getPendingCertifications(): Promise<PendingCertification[]> {
  const rows = await db
    .select({
      id: farmerCertifications.id,
      farmerId: farmerCertifications.farmerId,
      farmName: farmerProfiles.farmName,
      type: farmerCertifications.type,
      issuedBy: farmerCertifications.issuedBy,
      validUntil: farmerCertifications.validUntil,
      documentKey: farmerCertifications.documentKey,
      createdAt: farmerCertifications.createdAt,
    })
    .from(farmerCertifications)
    .innerJoin(farmerProfiles, eq(farmerCertifications.farmerId, farmerProfiles.id))
    .where(and(eq(farmerCertifications.verified, false), isNull(farmerCertifications.adminNote)));

  return rows;
}

/** Returns certifications for a given farmer profile. */
export async function getFarmerCertifications(farmerId: string) {
  return db.select().from(farmerCertifications).where(eq(farmerCertifications.farmerId, farmerId));
}
