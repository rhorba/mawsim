// In-app notification events — Sprint 6

export type NotificationEvent =
  | 'bid_received'
  | 'counteroffer_received'
  | 'deal_agreed'
  | 'payment_received'
  | 'delivery_confirmed'
  | 'escrow_released'
  | 'dispute_opened'
  | 'logistics_assigned'
  | 'price_alert_triggered';

export async function createNotification(_params: {
  userId: string;
  event: NotificationEvent;
  entityId: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  throw new Error('In-app notifications not yet implemented — Sprint 6');
}
