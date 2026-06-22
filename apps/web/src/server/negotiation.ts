'use server';

import { withRole } from '@/lib/action';
import { withRoleThrow } from '@/lib/action';
import { MoneySchema } from '@mawsim/core';
import type { Session } from '@mawsim/core';
import { type DB, withUserContext } from '@mawsim/db';
import {
  auditLogs,
  buyerProfiles,
  deals,
  escrows,
  farmerProfiles,
  listings,
  offers,
} from '@mawsim/db/schema';
import {
  type ContractData,
  NegotiationError,
  assertDealTransition,
  offerTotal,
} from '@mawsim/marketplace';
import { createNotification } from '@mawsim/notifications';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { DealRecord, DealSummary, DealThread, OfferRecord } from './deal-types';

// Fire-and-forget: never throw or block the caller.
function fireNotification(params: Parameters<typeof createNotification>[0]) {
  createNotification(params).catch((err) =>
    console.error('[negotiation] notification failed', err)
  );
}

/** Canonical R2 key a deal's contract lives at (uploaded once R2 lands, S6). */
function contractKeyFor(dealId: string): string {
  return `contracts/${dealId}.pdf`;
}

const MakeOfferSchema = z.object({
  listingId: z.string().uuid(),
  pricePerQtx: MoneySchema,
  quantityQtx: z.number().int().positive(),
  deliveryDate: z.coerce.date(),
  message: z.string().max(1000).optional(),
});

const CounterOfferSchema = z.object({
  dealId: z.string().uuid(),
  pricePerQtx: MoneySchema,
  quantityQtx: z.number().int().positive(),
  message: z.string().max(1000).optional(),
});

// --- profile resolvers (app connects as DB owner; RLS is a backstop, so every
// query enforces ownership explicitly — see migration 0004 for the RLS mirror).

async function requireFarmerId(tx: DB, userId: string): Promise<string> {
  const [p] = await tx
    .select({ id: farmerProfiles.id })
    .from(farmerProfiles)
    .where(eq(farmerProfiles.userId, userId))
    .limit(1);
  if (!p) throw new Error('Profil agriculteur introuvable — créez votre profil d’abord.');
  return p.id;
}

async function requireBuyerId(tx: DB, userId: string): Promise<string> {
  const [p] = await tx
    .select({ id: buyerProfiles.id })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, userId))
    .limit(1);
  if (!p) throw new Error('Profil acheteur introuvable — créez votre profil d’abord.');
  return p.id;
}

/** Load a deal the session user is a party to (by side), or throw. */
async function loadPartyDeal(tx: DB, session: Session, dealId: string): Promise<DealRecord> {
  const [deal] = await tx.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  if (!deal) throw new Error('Transaction introuvable.');

  if (session.role === 'admin') return deal as DealRecord;
  if (session.role === 'farmer') {
    const farmerId = await requireFarmerId(tx, session.userId);
    if (deal.farmerId !== farmerId) throw new Error('Transaction introuvable.');
  } else if (session.role === 'buyer') {
    const buyerId = await requireBuyerId(tx, session.userId);
    if (deal.buyerId !== buyerId) throw new Error('Transaction introuvable.');
  } else {
    throw new Error('Transaction introuvable.');
  }
  return deal as DealRecord;
}

/** Most recent offer on a deal (the standing offer being responded to). */
async function latestOffer(tx: DB, dealId: string): Promise<OfferRecord> {
  const [offer] = await tx
    .select()
    .from(offers)
    .where(eq(offers.dealId, dealId))
    .orderBy(desc(offers.createdAt))
    .limit(1);
  if (!offer) throw new NegotiationError('Aucune offre sur cette transaction.');
  return offer as OfferRecord;
}

async function counterpartyNameFor(
  tx: DB,
  deal: Pick<DealRecord, 'farmerId' | 'buyerId'>,
  viewerSide: 'farmer' | 'buyer' | 'admin'
): Promise<string> {
  // The viewer sees the *other* party (admin sees the farmer by convention).
  if (viewerSide === 'buyer') {
    const [f] = await tx
      .select({ name: farmerProfiles.farmName })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.id, deal.farmerId))
      .limit(1);
    return f?.name ?? '—';
  }
  const [b] = await tx
    .select({ name: buyerProfiles.companyName })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.id, deal.buyerId))
    .limit(1);
  return b?.name ?? '—';
}

async function buildThread(tx: DB, deal: DealRecord, session: Session): Promise<DealThread> {
  const viewerSide = session.role === 'admin' ? 'admin' : (session.role as 'farmer' | 'buyer');
  const history = (await tx
    .select()
    .from(offers)
    .where(eq(offers.dealId, deal.id))
    .orderBy(desc(offers.createdAt))) as OfferRecord[];

  const standing = history[0];
  const isOpen = deal.status === 'offer_made' || deal.status === 'negotiating';
  const counterpartyName = await counterpartyNameFor(tx, deal, viewerSide);

  const [escrow] = await tx.select().from(escrows).where(eq(escrows.dealId, deal.id)).limit(1);

  return {
    deal,
    offers: history,
    viewerSide,
    counterpartyName,
    // It is the viewer's turn when the standing offer is the *other* party's,
    // and the deal is still open to responses.
    canRespond: isOpen && !!standing && standing.authorUserId !== session.userId,
    escrow: (escrow as DealThread['escrow']) ?? null,
  };
}

/**
 * Buyer opens a negotiation by bidding on an active listing. Creates the deal
 * in `offer_made` plus the first offer; the deal's standing terms mirror the
 * latest offer throughout the negotiation.
 */
export const makeOfferOnListing = withRole(['buyer'], async (session, raw: unknown) => {
  const input = MakeOfferSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const buyerId = await requireBuyerId(tx, session.userId);

    const [listing] = await tx
      .select()
      .from(listings)
      .where(and(eq(listings.id, input.listingId), eq(listings.status, 'active')))
      .limit(1);
    if (!listing) throw new NegotiationError('Annonce introuvable ou non disponible.');

    if (input.quantityQtx < listing.minOrderQtx) {
      throw new NegotiationError(
        `La quantité doit être d’au moins ${listing.minOrderQtx} quintaux (commande minimale).`
      );
    }
    if (input.quantityQtx > listing.quantityQtx) {
      throw new NegotiationError(
        `La quantité demandée dépasse la disponibilité (${listing.quantityQtx} quintaux).`
      );
    }

    const total = offerTotal(input.pricePerQtx, input.quantityQtx);

    const [deal] = await tx
      .insert(deals)
      .values({
        listingId: listing.id,
        farmerId: listing.farmerId,
        buyerId,
        productCategory: listing.productCategory,
        productVariety: listing.productVariety,
        quantityQtx: input.quantityQtx,
        agreedPricePerQtx: input.pricePerQtx,
        totalAmount: total,
        deliveryRegion: listing.region,
        deliveryDate: input.deliveryDate,
        status: 'offer_made',
      })
      .returning();
    if (!deal) throw new Error('Échec de la création de la transaction.');

    await tx.insert(offers).values({
      dealId: deal.id,
      authorUserId: session.userId,
      pricePerQtx: input.pricePerQtx,
      quantityQtx: input.quantityQtx,
      message: input.message ?? null,
    });

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'deal',
      entityId: deal.id,
      action: 'bid',
      after: {
        pricePerQtx: input.pricePerQtx,
        quantityQtx: input.quantityQtx,
        listingId: listing.id,
      },
    });

    // Notify farmer about incoming offer.
    const [farmerUser] = await tx
      .select({ userId: farmerProfiles.userId })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.id, listing.farmerId))
      .limit(1);
    if (farmerUser) {
      fireNotification({
        userId: farmerUser.userId,
        event: 'bid_received',
        entityId: deal.id,
        data: { pricePerQtx: input.pricePerQtx, quantityQtx: input.quantityQtx },
      });
    }

    return buildThread(tx, deal as DealRecord, session);
  });
});

/**
 * Either party responds to the standing offer with new terms. Appends an offer
 * (history is append-only), moves `offer_made → negotiating` on first reply,
 * and keeps the deal's standing terms in sync with the newest offer.
 */
export const counterOffer = withRole(['farmer', 'buyer'], async (session, raw: unknown) => {
  const input = CounterOfferSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const deal = await loadPartyDeal(tx, session, input.dealId);

    if (deal.status !== 'offer_made' && deal.status !== 'negotiating') {
      throw new NegotiationError('Cette négociation est close.');
    }

    const standing = await latestOffer(tx, deal.id);
    if (standing.authorUserId === session.userId) {
      throw new NegotiationError("C'est au tour de l'autre partie de répondre.");
    }

    const total = offerTotal(input.pricePerQtx, input.quantityQtx);

    await tx.insert(offers).values({
      dealId: deal.id,
      authorUserId: session.userId,
      pricePerQtx: input.pricePerQtx,
      quantityQtx: input.quantityQtx,
      message: input.message ?? null,
    });

    // First reply opens negotiation; subsequent replies stay in `negotiating`.
    const nextStatus = deal.status === 'offer_made' ? 'negotiating' : deal.status;
    if (nextStatus !== deal.status) assertDealTransition(deal.status, nextStatus);

    const [updated] = await tx
      .update(deals)
      .set({
        status: nextStatus,
        agreedPricePerQtx: input.pricePerQtx,
        quantityQtx: input.quantityQtx,
        totalAmount: total,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, deal.id))
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'deal',
      entityId: deal.id,
      action: 'bid',
      before: { status: deal.status },
      after: { pricePerQtx: input.pricePerQtx, quantityQtx: input.quantityQtx },
    });

    // Notify the counterparty about the counter-offer.
    if (session.role === 'farmer') {
      const [buyerUser] = await tx
        .select({ userId: buyerProfiles.userId })
        .from(buyerProfiles)
        .where(eq(buyerProfiles.id, deal.buyerId))
        .limit(1);
      if (buyerUser) {
        fireNotification({
          userId: buyerUser.userId,
          event: 'counteroffer_received',
          entityId: deal.id,
          data: { pricePerQtx: input.pricePerQtx, quantityQtx: input.quantityQtx },
        });
      }
    } else {
      const [farmerUser] = await tx
        .select({ userId: farmerProfiles.userId })
        .from(farmerProfiles)
        .where(eq(farmerProfiles.id, deal.farmerId))
        .limit(1);
      if (farmerUser) {
        fireNotification({
          userId: farmerUser.userId,
          event: 'counteroffer_received',
          entityId: deal.id,
          data: { pricePerQtx: input.pricePerQtx, quantityQtx: input.quantityQtx },
        });
      }
    }

    return buildThread(tx, updated as DealRecord, session);
  });
});

/**
 * Accept the counterparty's standing offer → `agreed`. You cannot accept your
 * own offer. The deal's standing terms already mirror the accepted offer, so
 * only the status transitions here. Contract signing is a separate step (S3-03).
 */
export const acceptOffer = withRole(['farmer', 'buyer'], async (session, dealId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const deal = await loadPartyDeal(tx, session, dealId);

    const standing = await latestOffer(tx, deal.id);
    if (standing.authorUserId === session.userId) {
      throw new NegotiationError('Vous ne pouvez pas accepter votre propre offre.');
    }

    assertDealTransition(deal.status, 'agreed');

    const [updated] = await tx
      .update(deals)
      .set({
        status: 'agreed',
        agreedPricePerQtx: standing.pricePerQtx,
        quantityQtx: standing.quantityQtx,
        totalAmount: offerTotal(standing.pricePerQtx, standing.quantityQtx),
        updatedAt: new Date(),
      })
      .where(eq(deals.id, deal.id))
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'deal',
      entityId: deal.id,
      action: 'agree',
      before: { status: deal.status },
      after: {
        status: 'agreed',
        pricePerQtx: standing.pricePerQtx,
        quantityQtx: standing.quantityQtx,
      },
    });

    // Notify both parties that the deal is agreed.
    const [farmerUser] = await tx
      .select({ userId: farmerProfiles.userId })
      .from(farmerProfiles)
      .where(eq(farmerProfiles.id, deal.farmerId))
      .limit(1);
    const [buyerUser] = await tx
      .select({ userId: buyerProfiles.userId })
      .from(buyerProfiles)
      .where(eq(buyerProfiles.id, deal.buyerId))
      .limit(1);
    for (const userId of [farmerUser?.userId, buyerUser?.userId]) {
      if (userId) {
        fireNotification({ userId, event: 'deal_agreed', entityId: deal.id });
      }
    }

    return buildThread(tx, updated as DealRecord, session);
  });
});

/** Either party (or admin) abandons a still-open negotiation. */
export const cancelDeal = withRole(
  ['farmer', 'buyer', 'admin'],
  async (session, dealId: string) => {
    return withUserContext(session.userId, session.role, async (tx) => {
      const deal = await loadPartyDeal(tx, session, dealId);
      assertDealTransition(deal.status, 'cancelled');

      const [updated] = await tx
        .update(deals)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(deals.id, deal.id))
        .returning();

      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: 'deal',
        entityId: deal.id,
        action: 'update',
        before: { status: deal.status },
        after: { status: 'cancelled' },
      });

      return buildThread(tx, updated as DealRecord, session);
    });
  }
);

/** The signed-in user's deals (as farmer or buyer), newest activity first. */
export const getMyDeals = withRole(['farmer', 'buyer', 'admin'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    let rows: DealRecord[];
    if (session.role === 'farmer') {
      const farmerId = await requireFarmerId(tx, session.userId);
      rows = (await tx
        .select()
        .from(deals)
        .where(eq(deals.farmerId, farmerId))
        .orderBy(desc(deals.updatedAt))) as DealRecord[];
    } else if (session.role === 'buyer') {
      const buyerId = await requireBuyerId(tx, session.userId);
      rows = (await tx
        .select()
        .from(deals)
        .where(eq(deals.buyerId, buyerId))
        .orderBy(desc(deals.updatedAt))) as DealRecord[];
    } else {
      rows = (await tx
        .select()
        .from(deals)
        .orderBy(desc(deals.updatedAt))
        .limit(100)) as DealRecord[];
    }

    const side = session.role === 'admin' ? 'admin' : (session.role as 'farmer' | 'buyer');
    const summaries: DealSummary[] = [];
    for (const d of rows) {
      summaries.push({
        id: d.id,
        productCategory: d.productCategory,
        productVariety: d.productVariety,
        quantityQtx: d.quantityQtx,
        pricePerQtx: d.agreedPricePerQtx,
        totalAmount: d.totalAmount,
        deliveryRegion: d.deliveryRegion,
        deliveryDate: d.deliveryDate.toISOString(),
        status: d.status,
        counterpartyName: await counterpartyNameFor(tx, d, side),
        updatedAt: d.updatedAt.toISOString(),
      });
    }
    return summaries;
  });
});

/** Load one deal with its full offer thread (party-scoped). */
export const getDealThread = withRole(
  ['farmer', 'buyer', 'admin'],
  async (session, dealId: string) => {
    return withUserContext(session.userId, session.role, async (tx) => {
      const deal = await loadPartyDeal(tx, session, dealId);
      return buildThread(tx, deal, session);
    });
  }
);

/** Assemble the data the bilingual contract PDF needs from a party-scoped deal. */
async function buildContractData(tx: DB, deal: DealRecord): Promise<ContractData> {
  const [farmer] = await tx
    .select({ name: farmerProfiles.farmName, region: farmerProfiles.region })
    .from(farmerProfiles)
    .where(eq(farmerProfiles.id, deal.farmerId))
    .limit(1);
  const [buyer] = await tx
    .select({ name: buyerProfiles.companyName, ice: buyerProfiles.ice })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.id, deal.buyerId))
    .limit(1);

  let qualityGrade: string | undefined;
  if (deal.listingId) {
    const [l] = await tx
      .select({ grade: listings.qualityGrade })
      .from(listings)
      .where(eq(listings.id, deal.listingId))
      .limit(1);
    qualityGrade = l?.grade ?? undefined;
  }

  // exactOptionalPropertyTypes: omit optional keys entirely rather than set undefined.
  return {
    dealId: deal.id,
    farmerName: farmer?.name ?? '—',
    ...(farmer?.region ? { farmerRegion: farmer.region } : {}),
    buyerCompanyName: buyer?.name ?? '—',
    ...(buyer?.ice ? { buyerICE: buyer.ice } : {}),
    productCategory: deal.productCategory,
    ...(deal.productVariety ? { productVariety: deal.productVariety } : {}),
    ...(qualityGrade ? { qualityGrade } : {}),
    quantityQtx: deal.quantityQtx,
    agreedPricePerQtx: deal.agreedPricePerQtx,
    totalAmount: deal.totalAmount,
    deliveryRegion: deal.deliveryRegion,
    deliveryDate: deal.deliveryDate,
    contractDate: new Date(),
  };
}

/**
 * Buyer signs the agreed deal → `contract_signed`. The bilingual contract PDF
 * becomes downloadable at its canonical key; uploading the bytes to private R2
 * is wired when storage lands (S6). Escrow funding is the next step (S4).
 */
export const signContract = withRole(['buyer', 'admin'], async (session, dealId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const deal = await loadPartyDeal(tx, session, dealId);
    assertDealTransition(deal.status, 'contract_signed');

    const [updated] = await tx
      .update(deals)
      .set({
        status: 'contract_signed',
        contractKey: contractKeyFor(deal.id),
        updatedAt: new Date(),
      })
      .where(eq(deals.id, deal.id))
      .returning();

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'deal',
      entityId: deal.id,
      action: 'agree',
      before: { status: deal.status },
      after: { status: 'contract_signed', contractKey: contractKeyFor(deal.id) },
    });

    return buildThread(tx, updated as DealRecord, session);
  });
});

/**
 * Party-scoped contract data for on-demand PDF rendering (the download route).
 * Throws (not ActionResult) so the route handler maps it to an HTTP status.
 */
export const getContractData = withRoleThrow(
  ['farmer', 'buyer', 'admin'],
  async (session, dealId: string): Promise<ContractData> => {
    return withUserContext(session.userId, session.role, async (tx) => {
      const deal = await loadPartyDeal(tx, session, dealId);
      if (deal.status === 'offer_made' || deal.status === 'negotiating') {
        throw new NegotiationError('Le contrat est disponible une fois la transaction conclue.');
      }
      return buildContractData(tx, deal);
    });
  }
);
