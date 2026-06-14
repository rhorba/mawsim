// Email notifications via Resend — Sprint 6

export type EmailTemplate =
  | 'deal_confirmed'
  | 'payment_received'
  | 'delivery_reminder'
  | 'offer_received'
  | 'price_alert';

export async function sendEmail(_params: {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  locale?: 'fr' | 'ar';
}): Promise<void> {
  throw new Error('Email notifications not yet implemented — Sprint 6');
}
