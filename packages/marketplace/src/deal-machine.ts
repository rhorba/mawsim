import type { DealStatus } from '@mawsim/core';

// Valid deal state transitions — strict machine, no shortcuts
const DEAL_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  offer_made: ['negotiating', 'agreed', 'cancelled'],
  negotiating: ['agreed', 'cancelled'],
  agreed: ['contract_signed', 'cancelled'],
  contract_signed: ['escrow_funded', 'cancelled'],
  escrow_funded: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'disputed'],
  delivered: ['completed', 'disputed'],
  completed: [],
  disputed: ['completed', 'cancelled'],
  cancelled: [],
};

export class DealTransitionError extends Error {
  constructor(from: DealStatus, to: DealStatus) {
    super(`Invalid deal transition: ${from} → ${to}`);
    this.name = 'DealTransitionError';
  }
}

export function assertDealTransition(from: DealStatus, to: DealStatus): void {
  const allowed = DEAL_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new DealTransitionError(from, to);
  }
}

export function canTransition(from: DealStatus, to: DealStatus): boolean {
  return (DEAL_TRANSITIONS[from] ?? []).includes(to);
}
