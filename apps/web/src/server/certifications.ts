'use server';

import { withRole, withRoleThrow } from '@/lib/action';
import { withUserContext } from '@mawsim/db';
import { farmerCertifications, farmerProfiles } from '@mawsim/db/schema';
import {
  getFarmerCertifications,
  getPendingCertifications,
  submitCertification,
  verifyCertification,
} from '@mawsim/verification';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const SubmitCertSchema = z.object({
  type: z.enum(['organic', 'global_gap', 'label_maroc', 'fair_trade', 'other']),
  documentKey: z.string().min(1),
  issuedBy: z.string().min(1).max(200),
  validUntil: z.coerce.date(),
});

export const submitFarmerCertification = withRole(['farmer'], async (session, raw: unknown) => {
  const input = SubmitCertSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const [fp] = await tx
      .select({ id: farmerProfiles.id })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, session.userId))
      .limit(1);
    if (!fp) throw new Error('Profil agriculteur introuvable.');

    return submitCertification({
      farmerId: fp.id,
      type: input.type,
      documentKey: input.documentKey,
      issuedBy: input.issuedBy,
      validUntil: input.validUntil,
    });
  });
});

const VerifyCertSchema = z.object({
  certificationId: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
});

export const adminVerifyCertification = withRole(['admin'], async (_session, raw: unknown) => {
  const input = VerifyCertSchema.parse(raw);
  await verifyCertification({
    certificationId: input.certificationId,
    status: input.status,
    ...(input.note !== undefined ? { note: input.note } : {}),
  });
});

export const getAdminPendingCertifications = withRoleThrow(['admin'], async () => {
  return getPendingCertifications();
});

export const getMyFarmerCertifications = withRole(['farmer', 'admin'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    if (session.role === 'admin') {
      return tx.select().from(farmerCertifications).limit(200);
    }
    const [fp] = await tx
      .select({ id: farmerProfiles.id })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, session.userId))
      .limit(1);
    if (!fp) return [];
    return getFarmerCertifications(fp.id);
  });
});
