'use server';

import { withRole } from '@/lib/action';
import { FarmerProfileSchema } from '@mawsim/core';
import { withUserContext } from '@mawsim/db';
import { auditLogs, farmerCertifications, farmerProfiles } from '@mawsim/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { FarmerCertificationRecord, FarmerProfileRecord } from './profile-types';

/** The signed-in farmer's own profile, or null if not yet created. */
export const getMyFarmerProfile = withRole(['farmer', 'admin'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const [profile] = await tx
      .select()
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, session.userId))
      .limit(1);
    return (profile ?? null) as FarmerProfileRecord | null;
  });
});

/**
 * Create or update the signed-in farmer's profile. Bank details are NOT handled
 * here — they are encrypted + access-audited separately (Sprint 4 / payments).
 */
export const upsertFarmerProfile = withRole(['farmer'], async (session, raw: unknown) => {
  const input = FarmerProfileSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const [existing] = await tx
      .select({ id: farmerProfiles.id })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, session.userId))
      .limit(1);

    if (existing) {
      const [updated] = await tx
        .update(farmerProfiles)
        .set({
          farmName: input.farmName,
          region: input.region,
          commune: input.commune ?? null,
          farmSizeHa: input.farmSizeHa ?? null,
          products: input.products,
          updatedAt: new Date(),
        })
        .where(eq(farmerProfiles.id, existing.id))
        .returning();

      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: 'farmer_profile',
        entityId: existing.id,
        action: 'update',
        after: input,
      });
      return updated as FarmerProfileRecord;
    }

    const [created] = await tx
      .insert(farmerProfiles)
      .values({
        userId: session.userId,
        farmName: input.farmName,
        region: input.region,
        commune: input.commune ?? null,
        farmSizeHa: input.farmSizeHa ?? null,
        products: input.products,
      })
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'farmer_profile',
      entityId: created?.id ?? '',
      action: 'create',
      after: input,
    });
    return created as FarmerProfileRecord;
  });
});

/** Certifications attached to the signed-in farmer's profile. */
export const listMyCertifications = withRole(['farmer', 'admin'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const [profile] = await tx
      .select({ id: farmerProfiles.id })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, session.userId))
      .limit(1);
    if (!profile) return [] as FarmerCertificationRecord[];

    return tx
      .select()
      .from(farmerCertifications)
      .where(eq(farmerCertifications.farmerId, profile.id)) as Promise<FarmerCertificationRecord[]>;
  });
});

const AddCertificationSchema = z.object({
  type: z.enum(['organic', 'global_gap', 'label_maroc', 'fair_trade', 'other']),
  issuedBy: z.string().min(2).max(200),
  validUntil: z.coerce.date(),
  // documentKey points at a private R2 object. The actual upload + signed-URL
  // flow lands in Sprint 6 (verification package); here we record the metadata.
  documentKey: z.string().min(1).max(512),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement est requis pour téléverser un document (CNDP).' }),
  }),
});

/** Attach a certification record (document upload to R2 is Sprint 6). */
export const addCertification = withRole(['farmer'], async (session, raw: unknown) => {
  const input = AddCertificationSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const [profile] = await tx
      .select({ id: farmerProfiles.id })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, session.userId))
      .limit(1);
    if (!profile) {
      throw new Error('Profil agriculteur introuvable — créez votre profil d’abord.');
    }

    const [cert] = await tx
      .insert(farmerCertifications)
      .values({
        farmerId: profile.id,
        type: input.type,
        issuedBy: input.issuedBy,
        validUntil: input.validUntil,
        documentKey: input.documentKey,
        verified: false,
      })
      .returning();
    return cert as FarmerCertificationRecord;
  });
});

/** Remove a certification the farmer owns. */
export const deleteCertification = withRole(['farmer'], async (session, certId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const [profile] = await tx
      .select({ id: farmerProfiles.id })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, session.userId))
      .limit(1);
    if (!profile) return { deleted: false };

    await tx
      .delete(farmerCertifications)
      .where(
        and(eq(farmerCertifications.id, certId), eq(farmerCertifications.farmerId, profile.id))
      );
    return { deleted: true };
  });
});
