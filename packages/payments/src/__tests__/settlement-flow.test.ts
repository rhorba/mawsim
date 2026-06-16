import { describe, expect, it } from 'vitest';
import { assertEscrowTransition, buildEscrow } from '../escrow-machine.js';

// Documents the exact S4 settlement chain the escrow server actions perform, so
// any future change to the escrow machine that breaks the funding/release flow
// fails here rather than only in the (DB-bound) server action.
describe('S4 escrow settlement flow', () => {
  it('funds deposit then remainder then releases — each step legal', () => {
    expect(() => {
      assertEscrowTransition('pending', 'deposit_paid'); // buyer funds 30%
      assertEscrowTransition('deposit_paid', 'fully_funded'); // remainder captured on delivery
      assertEscrowTransition('fully_funded', 'released'); // released to farmer
    }).not.toThrow();
  });

  it('the released amount to the farmer is gross minus the 1.5% farmer fee', () => {
    const e = buildEscrow(2_000_000);
    // Buyer's total outlay (deposit + remainder) equals the gross deal amount;
    // the farmer receives gross minus their fee.
    expect(e.deposit + e.remainder).toBe(e.grossAmount);
    expect(e.farmerPayout).toBe(e.grossAmount - e.platformFeeFromFarmer);
  });

  it('cannot release without first reaching fully_funded (no skipping the remainder)', () => {
    expect(() => assertEscrowTransition('deposit_paid', 'released')).toThrow();
  });
});
