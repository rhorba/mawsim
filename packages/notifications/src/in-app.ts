// In-app notification persistence — writes to the notifications table.
// Called fire-and-forget from server actions; failures are logged, never thrown.

import { db } from '@mawsim/db';
import { notifications } from '@mawsim/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

export type NotificationEvent =
  | 'bid_received'
  | 'counteroffer_received'
  | 'deal_agreed'
  | 'payment_received'
  | 'delivery_confirmed'
  | 'escrow_released'
  | 'dispute_opened'
  | 'logistics_quoted'
  | 'logistics_assigned'
  | 'price_alert_triggered';

export async function createNotification(params: {
  userId: string;
  event: NotificationEvent;
  entityId: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(notifications).values({
    userId: params.userId,
    event: params.event,
    entityId: params.entityId,
    data: params.data ?? null,
  });
}

export async function getNotifications(
  userId: string,
  limit = 20
): Promise<(typeof notifications.$inferSelect)[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(sql`${notifications.readAt} IS NOT NULL, ${notifications.createdAt} DESC`)
    .limit(limit);
}

export async function markRead(notificationId: string, userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.count ?? 0;
}
