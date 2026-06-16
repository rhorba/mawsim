import { describe, expect, it } from 'vitest';
import { MockCmiGateway, PaymentError } from '../cmi.js';

describe('MockCmiGateway — charge', () => {
  const gw = new MockCmiGateway();

  it('captures a deposit charge and echoes the amount', async () => {
    const res = await gw.charge({ amount: 300_000, dealId: 'deal-1', purpose: 'escrow_deposit' });
    expect(res.status).toBe('captured');
    expect(res.amount).toBe(300_000);
    expect(res.providerRef).toContain('deal-1');
    expect(res.providerRef).toContain('escrow_deposit');
  });

  it('produces distinct refs for deposit vs remainder of the same deal', async () => {
    const dep = await gw.charge({ amount: 300_000, dealId: 'd', purpose: 'escrow_deposit' });
    const rem = await gw.charge({ amount: 700_000, dealId: 'd', purpose: 'escrow_remainder' });
    expect(dep.providerRef).not.toBe(rem.providerRef);
  });

  it('rejects non-integer (float) amounts — money is centimes', async () => {
    await expect(
      gw.charge({ amount: 100.5, dealId: 'd', purpose: 'escrow_deposit' })
    ).rejects.toBeInstanceOf(PaymentError);
  });

  it('rejects zero / negative amounts', async () => {
    await expect(
      gw.charge({ amount: 0, dealId: 'd', purpose: 'escrow_deposit' })
    ).rejects.toBeInstanceOf(PaymentError);
    await expect(
      gw.charge({ amount: -1, dealId: 'd', purpose: 'escrow_remainder' })
    ).rejects.toBeInstanceOf(PaymentError);
  });
});

describe('MockCmiGateway — refund', () => {
  const gw = new MockCmiGateway();

  it('refunds against a provider reference', async () => {
    const res = await gw.refund('cmi_mock_escrow_deposit_d', 300_000);
    expect(res.status).toBe('refunded');
    expect(res.amount).toBe(300_000);
    expect(res.providerRef).toBe('cmi_mock_escrow_deposit_d');
  });

  it('rejects invalid refund amounts', async () => {
    await expect(gw.refund('ref', 0)).rejects.toBeInstanceOf(PaymentError);
  });
});
