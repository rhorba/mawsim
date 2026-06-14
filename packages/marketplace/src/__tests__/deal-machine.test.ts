import type { DealStatus } from '@mawsim/core';
import { describe, expect, it } from 'vitest';
import { DealTransitionError, assertDealTransition, canTransition } from '../deal-machine.js';

// Full valid flow
const HAPPY_PATH: DealStatus[] = [
  'offer_made',
  'negotiating',
  'agreed',
  'contract_signed',
  'escrow_funded',
  'in_transit',
  'delivered',
  'completed',
];

describe('deal state machine — happy path', () => {
  it('traverses the full deal lifecycle without errors', () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      const from = HAPPY_PATH[i]!;
      const to = HAPPY_PATH[i + 1]!;
      expect(() => assertDealTransition(from, to)).not.toThrow();
    }
  });

  it('can skip negotiating: offer_made → agreed', () => {
    expect(() => assertDealTransition('offer_made', 'agreed')).not.toThrow();
  });
});

describe('deal state machine — cancellation paths', () => {
  const cancellableStates: DealStatus[] = [
    'offer_made',
    'negotiating',
    'agreed',
    'contract_signed',
    'escrow_funded',
  ];

  it.each(cancellableStates)('%s → cancelled is valid', (from) => {
    expect(() => assertDealTransition(from, 'cancelled')).not.toThrow();
  });
});

describe('deal state machine — dispute paths', () => {
  it('in_transit → disputed is valid', () => {
    expect(() => assertDealTransition('in_transit', 'disputed')).not.toThrow();
  });

  it('delivered → disputed is valid', () => {
    expect(() => assertDealTransition('delivered', 'disputed')).not.toThrow();
  });

  it('disputed → completed is valid (admin resolves in favor of completion)', () => {
    expect(() => assertDealTransition('disputed', 'completed')).not.toThrow();
  });

  it('disputed → cancelled is valid (admin resolves in favor of refund)', () => {
    expect(() => assertDealTransition('disputed', 'cancelled')).not.toThrow();
  });
});

describe('deal state machine — forbidden transitions (no skipping)', () => {
  it('offer_made cannot jump to escrow_funded', () => {
    expect(() => assertDealTransition('offer_made', 'escrow_funded')).toThrow(DealTransitionError);
  });

  it('agreed cannot jump to in_transit (must fund escrow first)', () => {
    expect(() => assertDealTransition('agreed', 'in_transit')).toThrow(DealTransitionError);
  });

  it('completed is terminal — no further transitions', () => {
    const allStatuses: DealStatus[] = [
      'offer_made',
      'negotiating',
      'agreed',
      'contract_signed',
      'escrow_funded',
      'in_transit',
      'delivered',
      'completed',
      'disputed',
      'cancelled',
    ];
    for (const to of allStatuses) {
      expect(() => assertDealTransition('completed', to)).toThrow(DealTransitionError);
    }
  });

  it('cancelled is terminal', () => {
    expect(() => assertDealTransition('cancelled', 'offer_made')).toThrow(DealTransitionError);
    expect(() => assertDealTransition('cancelled', 'agreed')).toThrow(DealTransitionError);
  });

  it('in_transit cannot go back to escrow_funded', () => {
    expect(() => assertDealTransition('in_transit', 'escrow_funded')).toThrow(DealTransitionError);
  });

  it('cannot go from delivered back to in_transit', () => {
    expect(() => assertDealTransition('delivered', 'in_transit')).toThrow(DealTransitionError);
  });

  it('cannot go from agreed back to negotiating', () => {
    expect(() => assertDealTransition('agreed', 'negotiating')).toThrow(DealTransitionError);
  });
});

describe('canTransition (non-throwing check)', () => {
  it('returns true for valid transitions', () => {
    expect(canTransition('offer_made', 'agreed')).toBe(true);
    expect(canTransition('escrow_funded', 'in_transit')).toBe(true);
  });

  it('returns false for invalid transitions', () => {
    expect(canTransition('completed', 'offer_made')).toBe(false);
    expect(canTransition('offer_made', 'escrow_funded')).toBe(false);
  });
});
