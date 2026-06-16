'use server';

import { withRole } from '@/lib/action';
import type { Session } from '@mawsim/core';
import { type DB, withUserContext } from '@mawsim/db';
import { auditLogs, buyerProfiles, deals, escrows, farmerProfiles } from '@mawsim/db/schema';
import { assertDealTransition } from '@mawsim/marketplace';
import {
  PaymentError,
  assertEscrowTransition,
  buildEscrow,
  paymentGateway,
} from '@mawsim/payments';
import { eq } from 'drizzle-orm';
import type { DealRecord } from './deal-types';

// App connects as DB owner; RLS is a backstop (migration 0005 mirrors this), so
// every query enforces party-ownership explicitly — same convention as
// negotiation.ts. These helpers are intentionally duplicated to keep the S3
// negotiation flow untouched.

async function requireFarmerId(tx: DB, userId: string): Promise<string> {
  const [p] = await tx
    .select({ id: farmerProfiles.id })
    .from(farmerProfiles)
    .where(eq(farmerProfiles.userId, userId))
    .limit(1);
  if (!p) throw new Error('Profil agriculteur introuvable.');
  return p.id;
}

async function requireBuyerId(tx: DB, userId: string): Promise<string> {
  const [p] = await tx
    .select({ id: buyerProfiles.id })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, userId))
    .limit(1);
  if (!p) throw new Error('Profil acheteur introuvable.');
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

/**
 * Buyer funds the 30% deposit on a signed contract → deal `escrow_funded`.
 * Creates the escrow ledger row (gross/deposit/remainder/fees computed once from
 * the deal total), captures the deposit via the payment gateway (CMI mock in
 * dev), and records the escrow in `deposit_paid`. Idempotent: a deal can only
 * ever have one escrow (unique deal_id).
 */
export const fundDeposit = withRole(['buyer', 'admin'], async (session, dealId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const deal = await loadPartyDeal(tx, session, dealId);

    if (deal.status !== 'contract_signed') {
      throw new PaymentError('Le contrat doit être signé avant le financement de l’acompte.');
    }

    const [existing] = await tx
      .select({ id: escrows.id })
      .from(escrows)
      .where(eq(escrows.dealId, deal.id))
      .limit(1);
    if (existing) throw new PaymentError('L’acompte de cette transaction a déjà été financé.');

    // contract_signed → escrow_funded must be legal before we charge anything.
    assertDealTransition(deal.status, 'escrow_funded');

    const e = buildEscrow(deal.totalAmount);

    // pending → deposit_paid (the only legal first move for a fresh escrow).
    assertEscrowTransition('pending', 'deposit_paid');
    const charge = await paymentGateway.charge({
      amount: e.deposit,
      dealId: deal.id,
      purpose: 'escrow_deposit',
    });

    const now = new Date();
    await tx.insert(escrows).values({
      dealId: deal.id,
      buyerId: deal.buyerId,
      farmerId: deal.farmerId,
      grossAmount: e.grossAmount,
      deposit: e.deposit,
      remainder: e.remainder,
      platformFeeFromBuyer: e.platformFeeFromBuyer,
      platformFeeFromFarmer: e.platformFeeFromFarmer,
      farmerPayout: e.farmerPayout,
      status: 'deposit_paid',
      depositPaidAt: now,
    });

    await tx
      .update(deals)
      .set({ status: 'escrow_funded', updatedAt: now })
      .where(eq(deals.id, deal.id));

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'escrow',
      entityId: deal.id,
      action: 'fund',
      before: { dealStatus: deal.status, escrowStatus: 'pending' },
      after: {
        dealStatus: 'escrow_funded',
        escrowStatus: 'deposit_paid',
        deposit: e.deposit,
        providerRef: charge.providerRef,
      },
    });
  });
});

/**
 * Farmer dispatches the goods once the deposit is in escrow → deal `in_transit`.
 * (Logistics matching is wired in S5; this is the manual dispatch signal.)
 */
export const markInTransit = withRole(['farmer', 'admin'], async (session, dealId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const deal = await loadPartyDeal(tx, session, dealId);
    assertDealTransition(deal.status, 'in_transit');

    await tx
      .update(deals)
      .set({ status: 'in_transit', updatedAt: new Date() })
      .where(eq(deals.id, deal.id));

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'deal',
      entityId: deal.id,
      action: 'update',
      before: { status: deal.status },
      after: { status: 'in_transit' },
    });
  });
});

/**
 * Dual delivery confirmation. Each party confirms independently; the confirming
 * side's timestamp is recorded. Once BOTH have confirmed, the deal moves
 * `in_transit → delivered`, the 70% remainder is captured and the escrow is
 * released to the farmer (`deposit_paid → fully_funded → released`), and the
 * deal closes (`delivered → completed`). (Reviews gate slots in at S6.)
 */
export const confirmDelivery = withRole(['farmer', 'buyer'], async (session, dealId: string) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const deal = await loadPartyDeal(tx, session, dealId);

    if (deal.status !== 'in_transit') {
      throw new PaymentError(
        'La confirmation de livraison n’est pas ouverte pour cette transaction.'
      );
    }

    const isFarmer = session.role === 'farmer';
    const alreadyConfirmed = isFarmer
      ? deal.farmerConfirmedDeliveryAt
      : deal.buyerConfirmedDeliveryAt;
    if (alreadyConfirmed) {
      throw new PaymentError(
        'Vous avez déjà confirmé la livraison — en attente de l’autre partie.'
      );
    }

    const now = new Date();
    const bothConfirmed = isFarmer
      ? !!deal.buyerConfirmedDeliveryAt
      : !!deal.farmerConfirmedDeliveryAt;

    // Record this party's confirmation.
    await tx
      .update(deals)
      .set({
        ...(isFarmer ? { farmerConfirmedDeliveryAt: now } : { buyerConfirmedDeliveryAt: now }),
        updatedAt: now,
      })
      .where(eq(deals.id, deal.id));

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: 'deal',
      entityId: deal.id,
      action: 'update',
      after: { confirmedBy: session.role, at: now.toISOString() },
    });

    if (!bothConfirmed) return; // wait for the counterparty.

    // Both parties confirmed → settle. Load escrow and verify funding state.
    const [escrow] = await tx.select().from(escrows).where(eq(escrows.dealId, deal.id)).limit(1);
    if (!escrow) throw new PaymentError('Aucun séquestre trouvé pour cette transaction.');
    if (escrow.status !== 'deposit_paid') {
      throw new PaymentError('Le séquestre n’est pas dans un état finançable.');
    }

    // Deal: in_transit → delivered → completed (both legal moves).
    assertDealTransition('in_transit', 'delivered');
    assertDealTransition('delivered', 'completed');
    // Escrow: deposit_paid → fully_funded → released (both legal moves).
    assertEscrowTransition('deposit_paid', 'fully_funded');
    assertEscrowTransition('fully_funded', 'released');

    const charge = await paymentGateway.charge({
      amount: escrow.remainder,
      dealId: deal.id,
      purpose: 'escrow_remainder',
    });

    await tx
      .update(escrows)
      .set({ status: 'released', fullyFundedAt: now, releasedAt: now })
      .where(eq(escrows.id, escrow.id));

    await tx
      .update(deals)
      .set({ status: 'completed', updatedAt: now })
      .where(eq(deals.id, deal.id));

    await tx.insert(auditLogs).values([
      {
        actorUserId: session.userId,
        entity: 'escrow',
        entityId: deal.id,
        action: 'fund',
        before: { escrowStatus: 'deposit_paid' },
        after: {
          escrowStatus: 'fully_funded',
          remainder: escrow.remainder,
          providerRef: charge.providerRef,
        },
      },
      {
        actorUserId: session.userId,
        entity: 'escrow',
        entityId: deal.id,
        action: 'release',
        before: { dealStatus: 'in_transit', escrowStatus: 'fully_funded' },
        after: {
          dealStatus: 'completed',
          escrowStatus: 'released',
          farmerPayout: escrow.farmerPayout,
        },
      },
    ]);
  });
});
