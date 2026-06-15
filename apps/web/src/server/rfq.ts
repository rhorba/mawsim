'use server';

import { withRole } from '@/lib/action';
import { RFQCreateSchema } from '@mawsim/core';
import type { ProductCategory, QualityGrade } from '@mawsim/core';
import { type DB, withUserContext } from '@mawsim/db';
import { auditLogs, buyerProfiles, farmerPublicProfiles, listings, rfqs } from '@mawsim/db/schema';
import {
  type MatchableListing,
  computeMatchScore,
  embedProduct,
  rfqHardFilter,
} from '@mawsim/marketplace';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { ListingRecord } from './listing-types';
import type { RfqMatchView, RfqRecord } from './rfq-types';

// quantityQtxMax must not be below quantityQtxMin — reported as a field error.
const RfqInputSchema = RFQCreateSchema.superRefine((d, ctx) => {
  if (d.quantityQtxMax < d.quantityQtxMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La quantité maximale doit être supérieure ou égale à la minimale.',
      path: ['quantityQtxMax'],
    });
  }
});

async function requireBuyerId(tx: DB, userId: string): Promise<string> {
  const [profile] = await tx
    .select({ id: buyerProfiles.id })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, userId))
    .limit(1);
  if (!profile) {
    throw new Error('Profil acheteur introuvable — créez votre profil d’abord.');
  }
  return profile.id;
}

type RfqCriteriaLike = {
  productCategory: string;
  quantityQtxMin: number;
  quantityQtxMax: number;
  maxPricePerQtx?: number | null;
  requiredQualityGrade: string;
  requiredCertifications: string[];
  deliveryRegion: string;
};

type Match = {
  listing: ListingRecord;
  farmName: string;
  sellerRating: number;
  score: number;
  similarity: number;
};

/**
 * S2-07 `matchListingsToRfq` — pgvector ANN candidate retrieval + business
 * re-ranking. Postgres narrows to the nearest active listings in the same
 * category via `<=>` (HNSW index), then the tested marketplace gate
 * (`rfqHardFilter`) + `computeMatchScore` produce the buyer-facing top-N.
 */
async function matchListingsToRfq(
  tx: DB,
  rfq: RfqCriteriaLike,
  vector: number[],
  limit = 5
): Promise<Match[]> {
  const vectorLiteral = `[${vector.join(',')}]`;
  const distance = sql<number>`${listings.productVector} <=> ${vectorLiteral}::vector`;

  const rows = await tx
    .select({
      listing: listings,
      farmName: farmerPublicProfiles.farmName,
      sellerRating: farmerPublicProfiles.avgRating,
      distance,
    })
    .from(listings)
    .innerJoin(farmerPublicProfiles, eq(listings.farmerId, farmerPublicProfiles.id))
    .where(
      and(
        eq(listings.status, 'active'),
        eq(listings.productCategory, rfq.productCategory as ProductCategory),
        isNotNull(listings.productVector)
      )
    )
    .orderBy(distance)
    .limit(limit * 4);

  const criteria = {
    productCategory: rfq.productCategory as ProductCategory,
    quantityQtxMin: rfq.quantityQtxMin,
    quantityQtxMax: rfq.quantityQtxMax,
    maxPricePerQtx: rfq.maxPricePerQtx ?? null,
    requiredQualityGrade: rfq.requiredQualityGrade as QualityGrade,
    requiredCertifications: rfq.requiredCertifications,
    deliveryRegion: rfq.deliveryRegion,
    productVector: vector,
  };

  const now = new Date();
  const matches: Match[] = [];
  for (const row of rows) {
    const l = row.listing as ListingRecord;
    const candidate: MatchableListing = {
      id: l.id,
      productCategory: l.productCategory,
      quantityQtx: l.quantityQtx,
      askPricePerQtx: l.askPricePerQtx,
      qualityGrade: l.qualityGrade,
      certificationIds: l.certificationIds,
      region: l.region,
      status: l.status,
      availableUntil: l.availableUntil,
      productVector: l.productVector,
    };
    if (!rfqHardFilter(criteria, candidate, now)) continue;

    // pgvector cosine distance ∈ [0,2] → similarity ∈ [0,1].
    const similarity = 1 - Number(row.distance ?? 2) / 2;
    const sellerRating = Number(row.sellerRating ?? 0);
    const score = computeMatchScore({
      similarity,
      listingGrade: l.qualityGrade,
      requiredGrade: criteria.requiredQualityGrade,
      sellerRating,
      askPricePerQtx: l.askPricePerQtx,
      maxPricePerQtx: criteria.maxPricePerQtx,
    });
    matches.push({ listing: l, farmName: row.farmName, sellerRating, score, similarity });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

function toMatchView(m: Match): RfqMatchView {
  return {
    listingId: m.listing.id,
    productCategory: m.listing.productCategory,
    productVariety: m.listing.productVariety,
    quantityQtx: m.listing.quantityQtx,
    qualityGrade: m.listing.qualityGrade,
    askPricePerQtx: m.listing.askPricePerQtx,
    region: m.listing.region,
    availableUntil: m.listing.availableUntil.toISOString(),
    certificationIds: m.listing.certificationIds,
    farmName: m.farmName,
    sellerRating: m.sellerRating,
    score: Math.round(m.score * 100) / 100,
    similarity: Math.round(m.similarity * 100) / 100,
  };
}

/** The signed-in buyer's RFQs, newest first. */
export const getMyRfqs = withRole(['buyer', 'admin'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const buyerId = await requireBuyerId(tx, session.userId);
    return tx
      .select()
      .from(rfqs)
      .where(eq(rfqs.buyerId, buyerId))
      .orderBy(desc(rfqs.createdAt)) as Promise<RfqRecord[]>;
  });
});

/** Create an RFQ, embed it, and surface the top-5 pgvector-matched listings. */
export const createRfq = withRole(['buyer'], async (session, raw: unknown) => {
  const input = RfqInputSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const buyerId = await requireBuyerId(tx, session.userId);
    const vector = embedProduct({
      productCategory: input.productCategory,
      productVariety: input.productVariety ?? null,
      qualityGrade: input.requiredQualityGrade,
      region: input.deliveryRegion,
      description: input.description ?? null,
    });

    const [created] = await tx
      .insert(rfqs)
      .values({
        buyerId,
        productCategory: input.productCategory,
        productVariety: input.productVariety ?? null,
        quantityQtxMin: input.quantityQtxMin,
        quantityQtxMax: input.quantityQtxMax,
        maxPricePerQtx: input.maxPricePerQtx ?? null,
        requiredQualityGrade: input.requiredQualityGrade,
        requiredCertifications: input.requiredCertifications,
        deliveryRegion: input.deliveryRegion,
        neededBy: input.neededBy,
        description: input.description ?? null,
        productVector: vector,
        status: 'open',
      })
      .returning();

    const matches = await matchListingsToRfq(
      tx,
      { ...input, maxPricePerQtx: input.maxPricePerQtx ?? null },
      vector,
      5
    );
    const matchedIds = matches.map((m) => m.listing.id);

    const [updated] = await tx
      .update(rfqs)
      .set({ matchedListingIds: matchedIds, status: matchedIds.length > 0 ? 'matched' : 'open' })
      .where(eq(rfqs.id, created?.id ?? ''))
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'rfq',
      entityId: created?.id ?? '',
      action: 'create',
      after: input,
    });

    return { rfq: updated as RfqRecord, matches: matches.map(toMatchView) };
  });
});

/** Load one of the buyer's RFQs with a fresh set of matched listings. */
export const getRfq = withRole(['buyer', 'admin'], async (session, rfqId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const buyerId = await requireBuyerId(tx, session.userId);
    const [rfq] = await tx
      .select()
      .from(rfqs)
      .where(and(eq(rfqs.id, rfqId), eq(rfqs.buyerId, buyerId)))
      .limit(1);
    if (!rfq) return null;

    const row = rfq as RfqRecord;
    const vector =
      row.productVector ??
      embedProduct({
        productCategory: row.productCategory as ProductCategory,
        productVariety: row.productVariety,
        qualityGrade: row.requiredQualityGrade as QualityGrade,
        region: row.deliveryRegion,
        description: row.description,
      });
    const matches = await matchListingsToRfq(tx, row, vector, 5);
    return { rfq: row, matches: matches.map(toMatchView) };
  });
});

/** Close an RFQ (buyer is done sourcing). */
export const closeRfq = withRole(['buyer', 'admin'], async (session, rfqId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const buyerId = await requireBuyerId(tx, session.userId);
    const [updated] = await tx
      .update(rfqs)
      .set({ status: 'closed' })
      .where(and(eq(rfqs.id, rfqId), eq(rfqs.buyerId, buyerId)))
      .returning();
    if (!updated) throw new Error('Appel d’offres introuvable.');

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'rfq',
      entityId: rfqId,
      action: 'update',
      after: { status: 'closed' },
    });
    return updated as RfqRecord;
  });
});
