'use server';

import { withRole } from '@/lib/action';
import { type DB, withUserContext } from '@mawsim/db';
import {
  auditLogs,
  buyerProfiles,
  deals,
  farmerProfiles,
  logisticsProfiles,
  logisticsQuotes,
  logisticsRequests,
} from '@mawsim/db/schema';
import { assertLogisticsTransition } from '@mawsim/logistics';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { DealRecord } from './deal-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type LogisticsRequestRecord = typeof logisticsRequests.$inferSelect;
export type LogisticsQuoteRecord = typeof logisticsQuotes.$inferSelect;

export type LogisticsRequestWithQuotes = LogisticsRequestRecord & {
  quotes: LogisticsQuoteRecord[];
  farmerFarmName: string;
  buyerCompanyName: string;
};

// ---------------------------------------------------------------------------
// Helpers (same access-control pattern as negotiation.ts / escrow.ts)
// ---------------------------------------------------------------------------

async function requireFarmerId(tx: DB, userId: string): Promise<string> {
  const [p] = await tx
    .select({ id: farmerProfiles.id })
    .from(farmerProfiles)
    .where(eq(farmerProfiles.userId, userId))
    .limit(1);
  if (!p) throw new Error('Profil agriculteur introuvable.');
  return p.id;
}

async function requireProviderId(tx: DB, userId: string): Promise<string> {
  const [p] = await tx
    .select({ id: logisticsProfiles.id })
    .from(logisticsProfiles)
    .where(eq(logisticsProfiles.userId, userId))
    .limit(1);
  if (!p) throw new Error("Profil transporteur introuvable — créez votre profil d'abord.");
  return p.id;
}

/** Auto-create a logistics request when the deal is funded (escrow_funded). */
export const createLogisticsRequest = withRole(
  ['farmer', 'buyer', 'admin'],
  async (session, dealId: string) => {
    return withUserContext(session.userId, session.role, async (tx) => {
      // Verify party access to deal.
      const [deal] = await tx.select().from(deals).where(eq(deals.id, dealId)).limit(1);
      if (!deal) throw new Error('Transaction introuvable.');

      const [existing] = await tx
        .select({ id: logisticsRequests.id })
        .from(logisticsRequests)
        .where(eq(logisticsRequests.dealId, dealId))
        .limit(1);
      if (existing) return existing.id;

      const d = deal as DealRecord;

      // origin = farmer's region, destination = deal delivery region
      const [farmer] = await tx
        .select({ region: farmerProfiles.region })
        .from(farmerProfiles)
        .where(eq(farmerProfiles.id, d.farmerId))
        .limit(1);

      const [req] = await tx
        .insert(logisticsRequests)
        .values({
          dealId,
          originRegion: farmer?.region ?? d.deliveryRegion,
          destinationRegion: d.deliveryRegion,
          productCategory: d.productCategory,
          // 1 quintal ≈ 0.1 tonne
          weightTonnes: d.quantityQtx / 10,
          truckType: 'standard',
          pickupDate: d.deliveryDate,
          urgent: false,
          status: 'open',
        })
        .returning();

      if (!req) throw new Error('Échec de la création de la demande de transport.');

      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: 'logistics_request',
        entityId: req.id,
        action: 'create',
        after: { dealId, status: 'open' },
      });

      return req.id;
    });
  }
);

/** Logistics provider submits a quote for an open request. */
const SubmitQuoteSchema = z.object({
  requestId: z.string().uuid(),
  priceQuoted: z.number().int().positive(),
  availableFrom: z.coerce.date(),
  message: z.string().max(500).optional(),
});

export const submitLogisticsQuote = withRole(['logistics'], async (session, raw: unknown) => {
  const input = SubmitQuoteSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const providerId = await requireProviderId(tx, session.userId);

    const [req] = await tx
      .select()
      .from(logisticsRequests)
      .where(eq(logisticsRequests.id, input.requestId))
      .limit(1);
    if (!req) throw new Error('Demande de transport introuvable.');
    if (req.status !== 'open' && req.status !== 'quoted') {
      throw new Error("Cette demande n'accepte plus de devis.");
    }

    const [quote] = await tx
      .insert(logisticsQuotes)
      .values({
        requestId: input.requestId,
        providerId,
        priceQuoted: input.priceQuoted,
        availableFrom: input.availableFrom,
        message: input.message ?? null,
        accepted: false,
      })
      .returning();

    // Move request to 'quoted' state (open → quoted).
    assertLogisticsTransition(req.status, 'quoted');
    await tx
      .update(logisticsRequests)
      .set({ status: 'quoted' })
      .where(eq(logisticsRequests.id, req.id));

    if (!quote) throw new Error('Échec de la création du devis.');

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'logistics_quote',
      entityId: quote.id,
      action: 'create',
      after: { requestId: input.requestId, priceQuoted: input.priceQuoted },
    });

    return quote.id;
  });
});

/** Deal party (farmer) accepts a quote → request moves to 'assigned'. */
export const acceptLogisticsQuote = withRole(
  ['farmer', 'admin'],
  async (session, quoteId: string) => {
    return withUserContext(session.userId, session.role, async (tx) => {
      const farmerId = session.role === 'admin' ? null : await requireFarmerId(tx, session.userId);

      const [quote] = await tx
        .select()
        .from(logisticsQuotes)
        .where(eq(logisticsQuotes.id, quoteId))
        .limit(1);
      if (!quote) throw new Error('Devis introuvable.');

      const [req] = await tx
        .select()
        .from(logisticsRequests)
        .where(eq(logisticsRequests.id, quote.requestId))
        .limit(1);
      if (!req) throw new Error('Demande de transport introuvable.');

      // Verify farmer is party to the deal.
      if (farmerId) {
        const [deal] = await tx.select().from(deals).where(eq(deals.id, req.dealId)).limit(1);
        if (!deal || (deal as DealRecord).farmerId !== farmerId) {
          throw new Error('Transaction introuvable.');
        }
      }

      assertLogisticsTransition(req.status, 'assigned');

      await tx
        .update(logisticsQuotes)
        .set({ accepted: true })
        .where(eq(logisticsQuotes.id, quoteId));

      await tx
        .update(logisticsRequests)
        .set({
          status: 'assigned',
          assignedProviderId: quote.providerId,
          agreedPrice: quote.priceQuoted,
        })
        .where(eq(logisticsRequests.id, req.id));

      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: 'logistics_request',
        entityId: req.id,
        action: 'update',
        before: { status: req.status },
        after: { status: 'assigned', providerId: quote.providerId },
      });
    });
  }
);

/** Get all open logistics requests (for provider dashboard). */
export const getOpenLogisticsRequests = withRole(['logistics', 'admin'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const reqs = await tx
      .select()
      .from(logisticsRequests)
      .where(and(eq(logisticsRequests.status, 'open')))
      .orderBy(desc(logisticsRequests.createdAt))
      .limit(50);

    const enriched: LogisticsRequestWithQuotes[] = [];
    for (const r of reqs) {
      const quotes = await tx
        .select()
        .from(logisticsQuotes)
        .where(eq(logisticsQuotes.requestId, r.id));

      const [deal] = await tx.select().from(deals).where(eq(deals.id, r.dealId)).limit(1);
      const d = deal as DealRecord | undefined;
      const [farmer] = d
        ? await tx
            .select({ farmName: farmerProfiles.farmName })
            .from(farmerProfiles)
            .where(eq(farmerProfiles.id, d.farmerId))
            .limit(1)
        : [undefined];
      const [buyer] = d
        ? await tx
            .select({ companyName: buyerProfiles.companyName })
            .from(buyerProfiles)
            .where(eq(buyerProfiles.id, d.buyerId))
            .limit(1)
        : [undefined];

      enriched.push({
        ...r,
        quotes: quotes as LogisticsQuoteRecord[],
        farmerFarmName: farmer?.farmName ?? '—',
        buyerCompanyName: buyer?.companyName ?? '—',
      });
    }

    return enriched;
  });
});

/** Get requests assigned to this provider + their quotes. */
export const getMyLogisticsJobs = withRole(['logistics'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const providerId = await requireProviderId(tx, session.userId);

    const myQuotes = await tx
      .select({ requestId: logisticsQuotes.requestId })
      .from(logisticsQuotes)
      .where(eq(logisticsQuotes.providerId, providerId));

    const requestIds = myQuotes.map((q) => q.requestId);
    if (requestIds.length === 0) return [];

    const reqs = await tx
      .select()
      .from(logisticsRequests)
      .where(eq(logisticsRequests.assignedProviderId, providerId))
      .orderBy(desc(logisticsRequests.createdAt));

    return reqs as LogisticsRequestRecord[];
  });
});

/** Get the logistics request for a deal (for deal page display). */
export const getDealLogisticsRequest = withRole(
  ['farmer', 'buyer', 'logistics', 'admin'],
  async (session, dealId: string) => {
    return withUserContext(session.userId, session.role, async (tx) => {
      const [req] = await tx
        .select()
        .from(logisticsRequests)
        .where(eq(logisticsRequests.dealId, dealId))
        .limit(1);
      if (!req) return null;

      const quotes = await tx
        .select()
        .from(logisticsQuotes)
        .where(eq(logisticsQuotes.requestId, req.id))
        .orderBy(desc(logisticsQuotes.createdAt));

      return { request: req as LogisticsRequestRecord, quotes: quotes as LogisticsQuoteRecord[] };
    });
  }
);
