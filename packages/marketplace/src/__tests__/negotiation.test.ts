import { describe, expect, it } from 'vitest';
import { NegotiationError, assertCanRespond, offerTotal } from '../negotiation.js';

describe('offerTotal', () => {
  it('multiplies integer centimes/qtx by quintaux', () => {
    // 320.00 MAD/qtx × 150 qtx = 48 000.00 MAD
    expect(offerTotal(32000, 150)).toBe(4800000);
  });

  it('stays exact (no float drift) for awkward prices', () => {
    expect(offerTotal(33333, 3)).toBe(99999);
  });

  it('rejects non-integer price (money must be centimes)', () => {
    expect(() => offerTotal(100.5, 10)).toThrow(NegotiationError);
  });

  it('rejects negative price', () => {
    expect(() => offerTotal(-1, 10)).toThrow(NegotiationError);
  });

  it('rejects zero / non-positive quantity', () => {
    expect(() => offerTotal(32000, 0)).toThrow(NegotiationError);
    expect(() => offerTotal(32000, -5)).toThrow(NegotiationError);
  });

  it('rejects fractional quantity', () => {
    expect(() => offerTotal(32000, 1.5)).toThrow(NegotiationError);
  });
});

describe('assertCanRespond — turn taking', () => {
  const farmer = 'user-farmer';
  const buyer = 'user-buyer';

  it('lets the counterparty respond to a standing offer', () => {
    // buyer made the standing offer → farmer may respond
    expect(() => assertCanRespond(buyer, farmer)).not.toThrow();
    // farmer made the standing offer → buyer may respond
    expect(() => assertCanRespond(farmer, buyer)).not.toThrow();
  });

  it('forbids responding to your own standing offer (no unilateral close)', () => {
    expect(() => assertCanRespond(buyer, buyer)).toThrow(NegotiationError);
    expect(() => assertCanRespond(farmer, farmer)).toThrow(NegotiationError);
  });
});
