import type { Money } from './types.js';

// All MAD amounts stored as integer centimes.
// 1 MAD = 100 centimes. Never use floats for money.

export function toMoney(mad: number): Money {
  return Math.round(mad * 100);
}

export function fromMoney(centimes: Money): number {
  return centimes / 100;
}

export function formatMAD(centimes: Money, locale: 'fr' | 'ar' = 'fr'): string {
  const value = centimes / 100;
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function addMoney(a: Money, b: Money): Money {
  return a + b;
}

export function subtractMoney(a: Money, b: Money): Money {
  return a - b;
}

export function multiplyMoney(centimes: Money, factor: number): Money {
  return Math.round(centimes * factor);
}

export function percentOf(centimes: Money, basisPoints: number): Money {
  // basisPoints: 250 = 2.5%, 150 = 1.5%
  return Math.round((centimes * basisPoints) / 10000);
}

// Platform commission: 2.5% from buyer + 1.5% from farmer = 4% total
export const BUYER_FEE_BPS = 250;
export const FARMER_FEE_BPS = 150;

export function computeFees(grossAmount: Money): {
  buyerFee: Money;
  farmerFee: Money;
  farmerPayout: Money;
  totalFees: Money;
} {
  const buyerFee = percentOf(grossAmount, BUYER_FEE_BPS);
  const farmerFee = percentOf(grossAmount, FARMER_FEE_BPS);
  return {
    buyerFee,
    farmerFee,
    farmerPayout: subtractMoney(grossAmount, farmerFee),
    totalFees: addMoney(buyerFee, farmerFee),
  };
}

// Escrow split: 30% deposit on contract, 70% on delivery
export const DEPOSIT_BPS = 3000;
export const REMAINDER_BPS = 7000;

export function computeEscrowSplit(grossAmount: Money): {
  deposit: Money;
  remainder: Money;
} {
  const deposit = percentOf(grossAmount, DEPOSIT_BPS);
  return {
    deposit,
    remainder: subtractMoney(grossAmount, deposit),
  };
}
