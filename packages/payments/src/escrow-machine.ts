import type { EscrowStatus } from '@mawsim/core';
import { computeEscrowSplit, computeFees } from '@mawsim/core';

const ESCROW_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  pending: ['deposit_paid', 'refunded'],
  deposit_paid: ['fully_funded', 'refunded', 'disputed'],
  fully_funded: ['released', 'disputed'],
  released: [],
  refunded: [],
  disputed: ['released', 'refunded'],
};

export class EscrowTransitionError extends Error {
  constructor(from: EscrowStatus, to: EscrowStatus) {
    super(`Invalid escrow transition: ${from} → ${to}`);
    this.name = 'EscrowTransitionError';
  }
}

export function assertEscrowTransition(from: EscrowStatus, to: EscrowStatus): void {
  const allowed = ESCROW_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new EscrowTransitionError(from, to);
  }
}

export function buildEscrow(grossAmount: number) {
  const { deposit, remainder } = computeEscrowSplit(grossAmount);
  const { buyerFee, farmerFee, farmerPayout } = computeFees(grossAmount);
  return {
    grossAmount,
    deposit,
    remainder,
    platformFeeFromBuyer: buyerFee,
    platformFeeFromFarmer: farmerFee,
    farmerPayout,
    totalBuyerPays: grossAmount + buyerFee,
  };
}
