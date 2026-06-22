import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Capture the send spy before vi.mock hoisting collapses the scope
const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'email-ok' }));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { sendEmail } from '../email.js';

const BASE_URL = 'https://mawsim.ma/deals/1';

describe('sendEmail — template rendering via Resend mock', () => {
  beforeEach(() => {
    process.env['RESEND_API_KEY'] = 'test-key-32chars';
    mockSend.mockClear();
  });

  afterEach(() => {
    process.env['RESEND_API_KEY'] = '';
  });

  // ── offer_received ──────────────────────────────────────────────────────────

  it('offer_received FR — correct subject and product in html', async () => {
    await sendEmail({
      to: 'farmer@test.ma',
      template: 'offer_received',
      data: { product: 'Blé dur Karim', price: '200', quantity: '50', url: BASE_URL },
      locale: 'fr',
    });
    expect(mockSend).toHaveBeenCalledOnce();
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('Nouvelle offre reçue — Mawsim');
    expect(arg['html']).toContain('Blé dur Karim');
    expect(arg['html']).toContain('200');
    expect(arg['html']).toContain('dir="ltr"');
    expect(arg['html']).toContain('Mawsim');
  });

  it('offer_received AR — correct subject and RTL direction', async () => {
    await sendEmail({
      to: 'farmer@test.ma',
      template: 'offer_received',
      data: { product: 'قمح', price: '200', quantity: '50', url: BASE_URL },
      locale: 'ar',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('عرض جديد على موسم');
    expect(arg['html']).toContain('dir="rtl"');
    expect(arg['html']).toContain('قمح');
  });

  // ── deal_confirmed ──────────────────────────────────────────────────────────

  it('deal_confirmed FR — subject and total amount in html', async () => {
    await sendEmail({
      to: 'buyer@test.ma',
      template: 'deal_confirmed',
      data: { product: 'Olives Picholine', total: '45000', url: BASE_URL },
      locale: 'fr',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('Votre transaction Mawsim est confirmée');
    expect(arg['html']).toContain('Olives Picholine');
    expect(arg['html']).toContain('45000');
  });

  it('deal_confirmed AR — correct subject', async () => {
    await sendEmail({
      to: 'buyer@test.ma',
      template: 'deal_confirmed',
      data: { product: 'زيتون', total: '45000', url: BASE_URL },
      locale: 'ar',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('تم تأكيد معاملتك على موسم');
    expect(arg['html']).toContain('زيتون');
  });

  // ── payment_received ────────────────────────────────────────────────────────

  it('payment_received FR — deposit amount in html', async () => {
    await sendEmail({
      to: 'farmer@test.ma',
      template: 'payment_received',
      data: { amount: '13500', url: BASE_URL },
      locale: 'fr',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('Paiement reçu — Mawsim');
    expect(arg['html']).toContain('13500');
    expect(arg['html']).toContain('70%');
  });

  it('payment_received AR — correct subject and amount', async () => {
    await sendEmail({
      to: 'farmer@test.ma',
      template: 'payment_received',
      data: { amount: '13500', url: BASE_URL },
      locale: 'ar',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('تم استلام الدفعة — موسم');
    expect(arg['html']).toContain('13500');
  });

  // ── delivery_reminder ───────────────────────────────────────────────────────

  it('delivery_reminder FR — date in html', async () => {
    await sendEmail({
      to: 'buyer@test.ma',
      template: 'delivery_reminder',
      data: { date: '2026-07-15' },
      locale: 'fr',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('Rappel de livraison — Mawsim');
    expect(arg['html']).toContain('2026-07-15');
  });

  it('delivery_reminder AR — correct subject', async () => {
    await sendEmail({
      to: 'buyer@test.ma',
      template: 'delivery_reminder',
      data: { date: '2026-07-15' },
      locale: 'ar',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('تذكير بالتسليم — موسم');
  });

  // ── price_alert ─────────────────────────────────────────────────────────────

  it('price_alert FR — threshold and current price in html', async () => {
    await sendEmail({
      to: 'user@test.ma',
      template: 'price_alert',
      data: {
        product: 'Blé tendre',
        region: 'Gharb-Chrarda-Béni Hssen',
        current: '18000',
        threshold: '17000',
        url: BASE_URL,
      },
      locale: 'fr',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('Alerte prix déclenchée — Mawsim');
    expect(arg['html']).toContain('Blé tendre');
    expect(arg['html']).toContain('18000');
    expect(arg['html']).toContain('17000');
    expect(arg['html']).toContain('Gharb-Chrarda-Béni Hssen');
  });

  it('price_alert AR — correct subject', async () => {
    await sendEmail({
      to: 'user@test.ma',
      template: 'price_alert',
      data: {
        product: 'قمح',
        region: 'مكناس',
        current: '18000',
        threshold: '17000',
        url: BASE_URL,
      },
      locale: 'ar',
    });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('تم تفعيل تنبيه السعر — موسم');
  });

  // ── defaults ────────────────────────────────────────────────────────────────

  it('defaults to locale fr when locale not specified', async () => {
    await sendEmail({ to: 'x@test.ma', template: 'offer_received', data: {} });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['subject']).toBe('Nouvelle offre reçue — Mawsim');
  });

  it('uses — placeholder when template data keys are absent', async () => {
    await sendEmail({ to: 'x@test.ma', template: 'deal_confirmed', data: {}, locale: 'fr' });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['html']).toContain('—');
  });

  it('sends from the correct from address', async () => {
    await sendEmail({ to: 'farmer@test.ma', template: 'payment_received', data: {}, locale: 'fr' });
    const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
    expect(arg['from']).toContain('noreply@mawsim.ma');
  });

  it('html contains brand header for every template', async () => {
    const templates = [
      'offer_received',
      'deal_confirmed',
      'payment_received',
      'delivery_reminder',
      'price_alert',
    ] as const;
    for (const template of templates) {
      mockSend.mockClear();
      await sendEmail({ to: 'x@test.ma', template, data: {}, locale: 'fr' });
      const arg = mockSend.mock.calls[0]![0] as Record<string, string>;
      expect(arg['html']).toContain('Mawsim');
    }
  });

  it('no-ops gracefully when RESEND_API_KEY is absent', async () => {
    process.env['RESEND_API_KEY'] = '';
    await expect(
      sendEmail({ to: 'x@test.ma', template: 'offer_received', data: {} })
    ).resolves.toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();
  });
});
