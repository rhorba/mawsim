'use server';

import { withRole } from '@/lib/action';
import { ListingCreateSchema } from '@mawsim/core';
import { type DB, enqueueListingEmbed, withUserContext } from '@mawsim/db';
import { auditLogs, farmerProfiles, listings } from '@mawsim/db/schema';
import { assertListingTransition, assertPublishable, embedProduct } from '@mawsim/marketplace';
import { and, desc, eq } from 'drizzle-orm';
import type { ListingRecord } from './listing-types';

const MANAGE_ROLES = ['farmer', 'admin'] as const;

/** Resolve the signed-in farmer's profile id, or throw a FR-facing error. */
async function requireFarmerId(tx: DB, userId: string): Promise<string> {
  const [profile] = await tx
    .select({ id: farmerProfiles.id })
    .from(farmerProfiles)
    .where(eq(farmerProfiles.userId, userId))
    .limit(1);
  if (!profile) {
    throw new Error('Profil agriculteur introuvable — créez votre profil d’abord.');
  }
  return profile.id;
}

/** Load a listing the farmer owns, or throw. */
async function loadOwnedListing(
  tx: DB,
  farmerId: string,
  listingId: string
): Promise<ListingRecord> {
  const [listing] = await tx
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.farmerId, farmerId)))
    .limit(1);
  if (!listing) {
    throw new Error('Annonce introuvable.');
  }
  return listing as ListingRecord;
}

/** Deterministic product embedding from a listing's descriptive fields. */
function vectorFor(listing: {
  productCategory: ListingRecord['productCategory'];
  productVariety: string | null;
  qualityGrade: ListingRecord['qualityGrade'];
  region: string;
  description: string | null;
}): number[] {
  return embedProduct({
    productCategory: listing.productCategory,
    productVariety: listing.productVariety,
    qualityGrade: listing.qualityGrade,
    region: listing.region,
    description: listing.description,
  });
}

/** The signed-in farmer's listings, newest first. */
export const getMyListings = withRole([...MANAGE_ROLES], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const farmerId = await requireFarmerId(tx, session.userId);
    return tx
      .select()
      .from(listings)
      .where(eq(listings.farmerId, farmerId))
      .orderBy(desc(listings.createdAt)) as Promise<ListingRecord[]>;
  });
});

/** Create a new listing in `draft`. No embedding until it is published. */
export const createListing = withRole(['farmer'], async (session, raw: unknown) => {
  const input = ListingCreateSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const farmerId = await requireFarmerId(tx, session.userId);

    const [created] = await tx
      .insert(listings)
      .values({
        farmerId,
        productCategory: input.productCategory,
        productVariety: input.productVariety ?? null,
        quantityQtx: input.quantityQtx,
        qualityGrade: input.qualityGrade,
        askPricePerQtx: input.askPricePerQtx,
        minOrderQtx: input.minOrderQtx,
        harvestDate: input.harvestDate ?? null,
        availableUntil: input.availableUntil,
        region: input.region,
        description: input.description ?? null,
        status: 'draft',
      })
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'listing',
      entityId: created?.id ?? '',
      action: 'create',
      after: input,
    });
    return created as ListingRecord;
  });
});

/** Edit a draft or active listing. Active listings stay commercially coherent. */
export const updateListing = withRole(
  ['farmer'],
  async (session, listingId: string, raw: unknown) => {
    const input = ListingCreateSchema.parse(raw);

    return withUserContext(session.userId, session.role, async (tx) => {
      const farmerId = await requireFarmerId(tx, session.userId);
      const current = await loadOwnedListing(tx, farmerId, listingId);

      if (current.status !== 'draft' && current.status !== 'active') {
        throw new Error('Seules les annonces en brouillon ou actives peuvent être modifiées.');
      }

      const next = {
        productCategory: input.productCategory,
        productVariety: input.productVariety ?? null,
        qualityGrade: input.qualityGrade,
        region: input.region,
        description: input.description ?? null,
      };

      // An active listing must remain publishable, and its vector tracks edits.
      let productVector = current.productVector;
      if (current.status === 'active') {
        assertPublishable({
          quantityQtx: input.quantityQtx,
          minOrderQtx: input.minOrderQtx,
          askPricePerQtx: input.askPricePerQtx,
          availableUntil: input.availableUntil,
        });
        productVector = vectorFor(next);
      }

      const [updated] = await tx
        .update(listings)
        .set({
          ...next,
          quantityQtx: input.quantityQtx,
          askPricePerQtx: input.askPricePerQtx,
          minOrderQtx: input.minOrderQtx,
          harvestDate: input.harvestDate ?? null,
          availableUntil: input.availableUntil,
          productVector,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, listingId))
        .returning();

      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: 'listing',
        entityId: listingId,
        action: 'update',
        before: { status: current.status },
        after: input,
      });

      if (current.status === 'active') await enqueueListingEmbed(listingId);
      return updated as ListingRecord;
    });
  }
);

/**
 * Publish a draft → `active` (publicly browsable). Validates commercial terms,
 * writes the product embedding synchronously (so the listing is immediately
 * matchable), audits the transition, and fires the async re-embed job.
 */
export const publishListing = withRole(['farmer'], async (session, listingId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const farmerId = await requireFarmerId(tx, session.userId);
    const current = await loadOwnedListing(tx, farmerId, listingId);

    assertListingTransition(current.status, 'active');
    assertPublishable({
      quantityQtx: current.quantityQtx,
      minOrderQtx: current.minOrderQtx,
      askPricePerQtx: current.askPricePerQtx,
      availableUntil: current.availableUntil,
    });

    const [updated] = await tx
      .update(listings)
      .set({ status: 'active', productVector: vectorFor(current), updatedAt: new Date() })
      .where(eq(listings.id, listingId))
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'listing',
      entityId: listingId,
      action: 'update',
      before: { status: current.status },
      after: { status: 'active' },
    });

    await enqueueListingEmbed(listingId);
    return updated as ListingRecord;
  });
});

/** Expire an active listing (availability window closed / farmer sold elsewhere). */
export const expireListing = withRole([...MANAGE_ROLES], async (session, listingId: string) => {
  return transition(session, listingId, 'expired');
});

/** Cancel a listing (draft/active/negotiating → cancelled). */
export const cancelListing = withRole([...MANAGE_ROLES], async (session, listingId: string) => {
  return transition(session, listingId, 'cancelled');
});

async function transition(
  session: { userId: string; role: string },
  listingId: string,
  to: ListingRecord['status']
): Promise<ListingRecord> {
  return withUserContext(session.userId, session.role, async (tx) => {
    const farmerId = session.role === 'admin' ? null : await requireFarmerId(tx, session.userId);

    const [current] = await tx
      .select()
      .from(listings)
      .where(
        farmerId
          ? and(eq(listings.id, listingId), eq(listings.farmerId, farmerId))
          : eq(listings.id, listingId)
      )
      .limit(1);
    if (!current) throw new Error('Annonce introuvable.');

    assertListingTransition(current.status, to);

    const [updated] = await tx
      .update(listings)
      .set({ status: to, updatedAt: new Date() })
      .where(eq(listings.id, listingId))
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'listing',
      entityId: listingId,
      action: 'update',
      before: { status: current.status },
      after: { status: to },
    });
    return updated as ListingRecord;
  });
}
