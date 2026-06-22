'use server';

import { withRole, withRoleThrow } from '@/lib/action';
import { withUserContext } from '@mawsim/db';
import {
  auditLogs,
  buyerProfiles,
  deals,
  escrows,
  farmerCertifications,
  farmerProfiles,
  pricePoints,
} from '@mawsim/db/schema';
import { assertDealIsDisputed, assertPricePositiveInteger } from '@mawsim/marketplace';
import { and, count, desc, eq, inArray, isNull, sum } from 'drizzle-orm';
import { z } from 'zod';

// ── Dashboard stats ───────────────────────────────────────────────────────────

export type DashboardStats = {
  gmvCentimes: number;
  activeDeals: number;
  disputes: number;
  pendingCerts: number;
  totalFarmers: number;
  totalBuyers: number;
};

const ACTIVE_STATUSES = [
  'offer_made',
  'negotiating',
  'agreed',
  'contract_signed',
  'escrow_funded',
  'in_transit',
  'delivered',
] as const;

export const getDashboardStats = withRoleThrow(
  ['admin'],
  async (session): Promise<DashboardStats> => {
    return withUserContext(session.userId, session.role, async (tx) => {
      const [gmvRow] = await tx
        .select({ gmv: sum(escrows.farmerPayout) })
        .from(escrows)
        .where(eq(escrows.status, 'released'));

      const [activeDealsRow] = await tx
        .select({ total: count() })
        .from(deals)
        .where(inArray(deals.status, [...ACTIVE_STATUSES]));

      const [disputesRow] = await tx
        .select({ total: count() })
        .from(deals)
        .where(eq(deals.status, 'disputed'));

      const [pendingCertsRow] = await tx
        .select({ total: count() })
        .from(farmerCertifications)
        .where(
          and(eq(farmerCertifications.verified, false), isNull(farmerCertifications.adminNote))
        );

      const [farmersRow] = await tx.select({ total: count() }).from(farmerProfiles);
      const [buyersRow] = await tx.select({ total: count() }).from(buyerProfiles);

      return {
        gmvCentimes: Number(gmvRow?.gmv ?? 0),
        activeDeals: activeDealsRow?.total ?? 0,
        disputes: disputesRow?.total ?? 0,
        pendingCerts: pendingCertsRow?.total ?? 0,
        totalFarmers: farmersRow?.total ?? 0,
        totalBuyers: buyersRow?.total ?? 0,
      };
    });
  }
);

// ── Admin deals list ──────────────────────────────────────────────────────────

export type AdminDealRow = {
  id: string;
  status: string;
  productCategory: string;
  productVariety: string | null;
  quantityQtx: number;
  totalAmount: number;
  farmName: string;
  companyName: string;
  createdAt: Date;
};

const dealSelectFields = {
  id: deals.id,
  status: deals.status,
  productCategory: deals.productCategory,
  productVariety: deals.productVariety,
  quantityQtx: deals.quantityQtx,
  totalAmount: deals.totalAmount,
  createdAt: deals.createdAt,
  farmName: farmerProfiles.farmName,
  companyName: buyerProfiles.companyName,
} as const;

function mapDealRow(r: {
  id: string;
  status: string;
  productCategory: string;
  productVariety: string | null;
  quantityQtx: number;
  totalAmount: number;
  createdAt: Date;
  farmName: string | null;
  companyName: string | null;
}): AdminDealRow {
  return { ...r, farmName: r.farmName ?? '—', companyName: r.companyName ?? '—' };
}

export const getAdminDeals = withRoleThrow(['admin'], async (session): Promise<AdminDealRow[]> => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const rows = await tx
      .select(dealSelectFields)
      .from(deals)
      .leftJoin(farmerProfiles, eq(deals.farmerId, farmerProfiles.id))
      .leftJoin(buyerProfiles, eq(deals.buyerId, buyerProfiles.id))
      .orderBy(desc(deals.createdAt))
      .limit(100);
    return rows.map(mapDealRow);
  });
});

export const getAdminDisputes = withRoleThrow(
  ['admin'],
  async (session): Promise<AdminDealRow[]> => {
    return withUserContext(session.userId, session.role, async (tx) => {
      const rows = await tx
        .select(dealSelectFields)
        .from(deals)
        .leftJoin(farmerProfiles, eq(deals.farmerId, farmerProfiles.id))
        .leftJoin(buyerProfiles, eq(deals.buyerId, buyerProfiles.id))
        .where(eq(deals.status, 'disputed'))
        .orderBy(desc(deals.createdAt))
        .limit(50);
      return rows.map(mapDealRow);
    });
  }
);

// ── Resolve dispute ───────────────────────────────────────────────────────────

const ResolveDisputeSchema = z.object({
  dealId: z.string().uuid(),
  resolution: z.enum(['complete', 'cancel']),
  adminNote: z.string().max(500).optional(),
});

export const resolveDispute = withRole(['admin'], async (session, raw: unknown) => {
  const input = ResolveDisputeSchema.parse(raw);

  return withUserContext(session.userId, session.role, async (tx) => {
    const [deal] = await tx.select().from(deals).where(eq(deals.id, input.dealId)).limit(1);
    if (!deal) throw new Error('Transaction introuvable.');
    assertDealIsDisputed(deal.status);

    const newDealStatus = input.resolution === 'complete' ? 'completed' : 'cancelled';
    const newEscrowStatus = input.resolution === 'complete' ? 'released' : 'refunded';

    await tx
      .update(deals)
      .set({ status: newDealStatus, updatedAt: new Date() })
      .where(eq(deals.id, input.dealId));

    await tx
      .update(escrows)
      .set({
        status: newEscrowStatus,
        ...(input.resolution === 'complete' ? { releasedAt: new Date() } : {}),
      })
      .where(eq(escrows.dealId, input.dealId));

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'deal',
      entityId: input.dealId,
      action: 'update',
      before: { status: 'disputed' },
      after: { status: newDealStatus, adminNote: input.adminNote ?? null },
    });
  });
});

// ── Add reference price ───────────────────────────────────────────────────────

const AddPriceSchema = z.object({
  productCategory: z.enum([
    'cereals',
    'olives',
    'dates',
    'citrus',
    'vegetables',
    'argan',
    'legumes',
    'other',
  ]),
  productVariety: z.string().max(100).optional(),
  region: z.string().min(1),
  pricePerQtx: z.number().int().positive(),
  source: z.enum(['onicl', 'admin_manual']).default('admin_manual'),
});

export const addOniclPrice = withRole(['admin'], async (session, raw: unknown) => {
  const input = AddPriceSchema.parse(raw);

  assertPricePositiveInteger(input.pricePerQtx);

  return withUserContext(session.userId, session.role, async (tx) => {
    const [row] = await tx
      .insert(pricePoints)
      .values({
        productCategory: input.productCategory,
        ...(input.productVariety ? { productVariety: input.productVariety } : {}),
        region: input.region,
        pricePerQtx: input.pricePerQtx,
        source: input.source,
      })
      .returning();

    if (!row) throw new Error('Échec de la création du prix de référence.');

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'price_point',
      entityId: row.id,
      action: 'create',
      after: {
        productCategory: input.productCategory,
        region: input.region,
        pricePerQtx: input.pricePerQtx,
        source: input.source,
      },
    });

    return row.id;
  });
});

// ── Recent price points (for admin prices page) ───────────────────────────────

export type PricePointRow = typeof pricePoints.$inferSelect;

export const getRecentPricePoints = withRoleThrow(
  ['admin'],
  async (session): Promise<PricePointRow[]> => {
    return withUserContext(session.userId, session.role, async (tx) => {
      return tx
        .select()
        .from(pricePoints)
        .where(inArray(pricePoints.source, ['onicl', 'admin_manual']))
        .orderBy(desc(pricePoints.recordedAt))
        .limit(30);
    });
  }
);
