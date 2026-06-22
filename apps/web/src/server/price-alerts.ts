'use server';

import { withRole } from '@/lib/action';
import { withUserContext } from '@mawsim/db';
import { priceAlerts } from '@mawsim/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const CreateAlertSchema = z.object({
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
  thresholdPricePerQtx: z.number().int().positive(),
  direction: z.enum(['above', 'below']),
});

/** Create a price alert for the logged-in user. */
export const createAlert = withRole(['farmer', 'buyer', 'admin'], async (session, raw: unknown) => {
  const input = CreateAlertSchema.parse(raw);
  return withUserContext(session.userId, session.role, async (tx) => {
    const { randomUUID } = await import('node:crypto');
    const id = randomUUID();
    await tx.insert(priceAlerts).values({
      id,
      userId: session.userId,
      productCategory: input.productCategory,
      ...(input.productVariety ? { productVariety: input.productVariety } : {}),
      region: input.region,
      thresholdPricePerQtx: input.thresholdPricePerQtx,
      direction: input.direction,
      active: true,
    });
    return id;
  });
});

/** Deactivate (soft delete) a price alert the user owns. */
export const deleteAlert = withRole(
  ['farmer', 'buyer', 'admin'],
  async (session, alertId: string) => {
    return withUserContext(session.userId, session.role, async (tx) => {
      const [alert] = await tx
        .select({ userId: priceAlerts.userId })
        .from(priceAlerts)
        .where(eq(priceAlerts.id, alertId))
        .limit(1);
      if (!alert) throw new Error('Alerte introuvable.');
      if (alert.userId !== session.userId && session.role !== 'admin') {
        throw new Error('Accès refusé.');
      }
      await tx.update(priceAlerts).set({ active: false }).where(eq(priceAlerts.id, alertId));
    });
  }
);

/** List active alerts for the logged-in user. */
export const getMyAlerts = withRole(['farmer', 'buyer', 'admin'], async (session) => {
  return withUserContext(session.userId, session.role, async (tx) => {
    const rows = await tx
      .select()
      .from(priceAlerts)
      .where(and(eq(priceAlerts.userId, session.userId), eq(priceAlerts.active, true)))
      .orderBy(desc(priceAlerts.createdAt));
    return rows;
  });
});
