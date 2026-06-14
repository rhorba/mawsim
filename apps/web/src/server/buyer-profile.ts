'use server';

import { withRole } from '@/lib/action';
import { BuyerProfileSchema } from '@mawsim/core';
import { withUserContext } from '@mawsim/db';
import { auditLogs, buyerProfiles } from '@mawsim/db/schema';
import { eq } from 'drizzle-orm';
import type { BuyerProfileRecord } from './profile-types';

/** The signed-in buyer's own profile, or null if not yet created. */
export const getMyBuyerProfile = withRole(['buyer', 'admin'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const [profile] = await tx
      .select()
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, session.userId))
      .limit(1);
    return (profile ?? null) as BuyerProfileRecord | null;
  });
});

/**
 * Create or update the signed-in buyer's profile. Business verification
 * (RC/ICE existence) is a stub in dev — verifiedBusiness stays false until an
 * admin verifies (real DGI/ICE API is a v0.2 item, see CLAUDE.md §4).
 */
export const upsertBuyerProfile = withRole(['buyer'], async (session, raw: unknown) => {
  const input = BuyerProfileSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const [existing] = await tx
      .select({ id: buyerProfiles.id })
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, session.userId))
      .limit(1);

    if (existing) {
      const [updated] = await tx
        .update(buyerProfiles)
        .set({
          companyName: input.companyName,
          ice: input.ice ?? null,
          rc: input.rc ?? null,
          sector: input.sector,
          city: input.city,
          updatedAt: new Date(),
        })
        .where(eq(buyerProfiles.id, existing.id))
        .returning();

      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: 'buyer_profile',
        entityId: existing.id,
        action: 'update',
        after: input,
      });
      return updated as BuyerProfileRecord;
    }

    const [created] = await tx
      .insert(buyerProfiles)
      .values({
        userId: session.userId,
        companyName: input.companyName,
        ice: input.ice ?? null,
        rc: input.rc ?? null,
        sector: input.sector,
        city: input.city,
        verifiedBusiness: false,
      })
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'buyer_profile',
      entityId: created?.id ?? '',
      action: 'create',
      after: input,
    });
    return created as BuyerProfileRecord;
  });
});

/** Business verification stub — checks ICE format presence (real API is v0.2). */
export const requestBusinessVerification = withRole(['buyer'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const [profile] = await tx
      .select()
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, session.userId))
      .limit(1);
    if (!profile) {
      throw new Error('Profil acheteur introuvable — créez votre profil d’abord.');
    }
    // Dev stub: an ICE present + 15 digits is a precondition; admin confirms.
    const eligible = !!profile.ice && /^\d{15}$/.test(profile.ice);
    return {
      submitted: eligible,
      reason: eligible ? null : 'ICE manquant ou invalide (15 chiffres requis).',
    };
  });
});
