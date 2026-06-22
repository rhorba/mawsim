// Price alert engine — pg-boss job: price.alerts
// Runs periodically; compares the latest 7-day avg per product/region to each
// active alert threshold and marks triggered alerts.

import { db } from '@mawsim/db';
import { priceAlerts, pricePoints } from '@mawsim/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

export interface AlertMatch {
  alertId: string;
  userId: string;
  productCategory: string;
  productVariety?: string;
  region: string;
  direction: 'above' | 'below';
  thresholdPricePerQtx: number;
  currentAvgPricePerQtx: number;
}

/** Check all active price alerts against current 7-day averages.
 *  Returns the list of newly triggered alerts (caller handles notification). */
export async function checkPriceAlerts(): Promise<AlertMatch[]> {
  const active = await db.select().from(priceAlerts).where(eq(priceAlerts.active, true));

  const triggered: AlertMatch[] = [];
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const alert of active) {
    const conds = [
      eq(pricePoints.productCategory, alert.productCategory),
      eq(pricePoints.region, alert.region),
      gte(pricePoints.recordedAt, since7d),
    ];
    if (alert.productVariety) {
      conds.push(eq(pricePoints.productVariety, alert.productVariety));
    }

    const [row] = await db
      .select({ avg: sql<number>`round(avg(price_per_qtx))` })
      .from(pricePoints)
      .where(and(...conds));

    const currentAvg = row?.avg;
    if (!currentAvg) continue;

    const threshold = alert.thresholdPricePerQtx;
    const isAbove = alert.direction === 'above' && currentAvg >= threshold;
    const isBelow = alert.direction === 'below' && currentAvg <= threshold;

    if (isAbove || isBelow) {
      triggered.push({
        alertId: alert.id,
        userId: alert.userId,
        productCategory: alert.productCategory,
        ...(alert.productVariety ? { productVariety: alert.productVariety } : {}),
        region: alert.region,
        direction: alert.direction as 'above' | 'below',
        thresholdPricePerQtx: threshold,
        currentAvgPricePerQtx: currentAvg,
      });

      // Stamp lastTriggeredAt so we don't re-notify on the very next run.
      await db
        .update(priceAlerts)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(priceAlerts.id, alert.id));
    }
  }

  return triggered;
}

/** Create a new price alert for a user. Returns the created alert id. */
export async function createPriceAlert(input: {
  userId: string;
  productCategory: string;
  productVariety?: string;
  region: string;
  thresholdPricePerQtx: number;
  direction: 'above' | 'below';
}): Promise<string> {
  const { randomUUID } = await import('node:crypto');
  const id = randomUUID();
  await db.insert(priceAlerts).values({
    id,
    userId: input.userId,
    productCategory: input.productCategory,
    ...(input.productVariety ? { productVariety: input.productVariety } : {}),
    region: input.region,
    thresholdPricePerQtx: input.thresholdPricePerQtx,
    direction: input.direction,
    active: true,
  });
  return id;
}

/** Deactivate a price alert (soft delete — keeps history). */
export async function deactivatePriceAlert(alertId: string): Promise<void> {
  await db.update(priceAlerts).set({ active: false }).where(eq(priceAlerts.id, alertId));
}
