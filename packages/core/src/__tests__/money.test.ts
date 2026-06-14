import { describe, expect, it } from 'vitest';
import {
  BUYER_FEE_BPS,
  DEPOSIT_BPS,
  FARMER_FEE_BPS,
  REMAINDER_BPS,
  computeEscrowSplit,
  computeFees,
  formatMAD,
  fromMoney,
  percentOf,
  toMoney,
} from '../money.js';

describe('toMoney / fromMoney', () => {
  it('converts MAD to integer centimes', () => {
    expect(toMoney(320)).toBe(32000);
    expect(toMoney(320.5)).toBe(32050);
    expect(toMoney(0.01)).toBe(1);
  });

  it('round-trips correctly', () => {
    expect(fromMoney(toMoney(320))).toBe(320);
    expect(fromMoney(32000)).toBe(320);
  });
});

describe('percentOf (basis points)', () => {
  it('computes 2.5% (250 bps) correctly', () => {
    // 100 000 centimes * 250 bps = 2 500 centimes
    expect(percentOf(100_000, 250)).toBe(2_500);
  });

  it('computes 1.5% (150 bps) correctly', () => {
    expect(percentOf(100_000, 150)).toBe(1_500);
  });

  it('rounds to nearest centime', () => {
    // 99_999 * 250 / 10000 = 2499.975 → 2500
    expect(percentOf(99_999, 250)).toBe(2500);
  });
});

describe('computeFees (commission structure)', () => {
  it('charges 2.5% from buyer and 1.5% from farmer', () => {
    const gross = 1_000_000; // 10 000 MAD

    const { buyerFee, farmerFee, farmerPayout, totalFees } = computeFees(gross);

    expect(buyerFee).toBe(percentOf(gross, BUYER_FEE_BPS)); // 2.5%
    expect(farmerFee).toBe(percentOf(gross, FARMER_FEE_BPS)); // 1.5%
    expect(totalFees).toBe(buyerFee + farmerFee); // 4%
    expect(farmerPayout).toBe(gross - farmerFee);
  });

  it('total commission is exactly 4%', () => {
    const gross = 500_000; // 5 000 MAD
    const { buyerFee, farmerFee } = computeFees(gross);
    const totalBps = BUYER_FEE_BPS + FARMER_FEE_BPS; // 400 bps = 4%
    expect(buyerFee + farmerFee).toBe(percentOf(gross, totalBps));
  });

  it('farmer receives gross minus 1.5%', () => {
    const gross = 200_000;
    const { farmerPayout, farmerFee } = computeFees(gross);
    expect(farmerPayout + farmerFee).toBe(gross);
  });
});

describe('computeEscrowSplit (30% + 70%)', () => {
  it('deposit is 30%, remainder is 70%', () => {
    const gross = 1_000_000;
    const { deposit, remainder } = computeEscrowSplit(gross);

    expect(deposit).toBe(300_000); // 30%
    expect(remainder).toBe(700_000); // 70%
  });

  it('deposit + remainder equals gross amount', () => {
    const gross = 873_456;
    const { deposit, remainder } = computeEscrowSplit(gross);
    expect(deposit + remainder).toBe(gross);
  });

  it('deposit + remainder equals gross for edge amounts', () => {
    // 30% split precision: any rounding must not lose money
    for (const gross of [1, 99, 100, 1001, 99_999, 1_000_001]) {
      const { deposit, remainder } = computeEscrowSplit(gross);
      expect(deposit + remainder).toBe(gross);
    }
  });

  it('basis point constants sum to 10000 (100%)', () => {
    expect(DEPOSIT_BPS + REMAINDER_BPS).toBe(10_000);
  });
});

describe('formatMAD', () => {
  it('formats centimes as MAD string', () => {
    const formatted = formatMAD(32_000_00); // 32 000 MAD
    expect(formatted).toContain('MAD');
  });

  it('formats Arabic locale', () => {
    const formatted = formatMAD(32_000_00, 'ar');
    // ar-MA locale uses Arabic currency symbol د.م. not "MAD"
    expect(formatted).toContain('د.م.');
  });
});
