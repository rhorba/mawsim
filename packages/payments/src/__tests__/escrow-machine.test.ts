import type { EscrowStatus } from '@mawsim/core';
import { describe, expect, it } from 'vitest';
import { EscrowTransitionError, assertEscrowTransition, buildEscrow } from '../escrow-machine.js';

describe('escrow state machine — valid transitions', () => {
  it('pending → deposit_paid (30% received)', () => {
    expect(() => assertEscrowTransition('pending', 'deposit_paid')).not.toThrow();
  });

  it('deposit_paid → fully_funded (70% received)', () => {
    expect(() => assertEscrowTransition('deposit_paid', 'fully_funded')).not.toThrow();
  });

  it('fully_funded → released (delivery confirmed)', () => {
    expect(() => assertEscrowTransition('fully_funded', 'released')).not.toThrow();
  });

  it('pending → refunded (deal cancelled before payment)', () => {
    expect(() => assertEscrowTransition('pending', 'refunded')).not.toThrow();
  });

  it('deposit_paid → refunded (deal cancelled after deposit)', () => {
    expect(() => assertEscrowTransition('deposit_paid', 'refunded')).not.toThrow();
  });

  it('deposit_paid → disputed', () => {
    expect(() => assertEscrowTransition('deposit_paid', 'disputed')).not.toThrow();
  });

  it('fully_funded → disputed', () => {
    expect(() => assertEscrowTransition('fully_funded', 'disputed')).not.toThrow();
  });

  it('disputed → released (admin resolves in buyer/farmer favor)', () => {
    expect(() => assertEscrowTransition('disputed', 'released')).not.toThrow();
  });

  it('disputed → refunded (admin resolves in buyer favor)', () => {
    expect(() => assertEscrowTransition('disputed', 'refunded')).not.toThrow();
  });
});

describe('escrow state machine — terminal states', () => {
  const terminals: EscrowStatus[] = ['released', 'refunded'];
  const allStates: EscrowStatus[] = [
    'pending',
    'deposit_paid',
    'fully_funded',
    'released',
    'refunded',
    'disputed',
  ];

  it.each(terminals)('%s is terminal — no further transitions', (terminal) => {
    for (const to of allStates) {
      expect(() => assertEscrowTransition(terminal, to)).toThrow(EscrowTransitionError);
    }
  });
});

describe('escrow state machine — forbidden skips', () => {
  it('cannot go from pending directly to fully_funded (must pay deposit first)', () => {
    expect(() => assertEscrowTransition('pending', 'fully_funded')).toThrow(EscrowTransitionError);
  });

  it('cannot go from pending directly to released', () => {
    expect(() => assertEscrowTransition('pending', 'released')).toThrow(EscrowTransitionError);
  });

  it('cannot go from fully_funded back to deposit_paid', () => {
    expect(() => assertEscrowTransition('fully_funded', 'deposit_paid')).toThrow(
      EscrowTransitionError
    );
  });
});

describe('buildEscrow — 30/70 split + fee computation', () => {
  it('deposit is exactly 30% of gross', () => {
    const e = buildEscrow(1_000_000);
    expect(e.deposit).toBe(300_000);
  });

  it('remainder is exactly 70% of gross', () => {
    const e = buildEscrow(1_000_000);
    expect(e.remainder).toBe(700_000);
  });

  it('deposit + remainder = gross amount', () => {
    for (const gross of [100, 99_999, 1_000_000, 5_437_891]) {
      const e = buildEscrow(gross);
      expect(e.deposit + e.remainder).toBe(gross);
    }
  });

  it('buyer fee is 2.5% of gross', () => {
    const e = buildEscrow(1_000_000);
    expect(e.platformFeeFromBuyer).toBe(25_000); // 2.5% of 1 000 000
  });

  it('farmer fee is 1.5% of gross', () => {
    const e = buildEscrow(1_000_000);
    expect(e.platformFeeFromFarmer).toBe(15_000); // 1.5% of 1 000 000
  });

  it('total fees are 4% of gross', () => {
    const e = buildEscrow(1_000_000);
    expect(e.platformFeeFromBuyer + e.platformFeeFromFarmer).toBe(40_000); // 4%
  });

  it('farmer payout = gross - farmer fee', () => {
    const e = buildEscrow(1_000_000);
    expect(e.farmerPayout).toBe(985_000); // 1 000 000 - 15 000
  });

  it('farmer payout + farmer fee = gross', () => {
    for (const gross of [500_000, 1_500_000, 99_999]) {
      const e = buildEscrow(gross);
      expect(e.farmerPayout + e.platformFeeFromFarmer).toBe(gross);
    }
  });

  it('total buyer pays = gross + buyer fee', () => {
    const e = buildEscrow(1_000_000);
    expect(e.totalBuyerPays).toBe(1_025_000); // gross + 2.5%
  });
});
