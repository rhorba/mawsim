import { describe, expect, it } from 'vitest';
import {
  ListingTransitionError,
  ListingValidationError,
  type PublishableListing,
  assertListingTransition,
  assertPublishable,
  canPublish,
  canTransitionListing,
  isExpired,
} from '../listing.js';

const NOW = new Date('2026-06-14T00:00:00Z');
const FUTURE = new Date('2026-09-01T00:00:00Z');
const PAST = new Date('2026-01-01T00:00:00Z');

function pub(overrides: Partial<PublishableListing> = {}): PublishableListing {
  return {
    quantityQtx: 500,
    minOrderQtx: 50,
    askPricePerQtx: 40000,
    availableUntil: FUTURE,
    ...overrides,
  };
}

describe('listing transitions', () => {
  it('allows draft → active', () => {
    expect(canTransitionListing('draft', 'active')).toBe(true);
    expect(() => assertListingTransition('draft', 'active')).not.toThrow();
  });
  it('forbids sold → active (terminal)', () => {
    expect(canTransitionListing('sold', 'active')).toBe(false);
    expect(() => assertListingTransition('sold', 'active')).toThrow(ListingTransitionError);
  });
  it('forbids draft → sold (must pass through active)', () => {
    expect(canTransitionListing('draft', 'sold')).toBe(false);
  });
  it('allows relisting an expired listing', () => {
    expect(canTransitionListing('expired', 'active')).toBe(true);
  });
});

describe('assertPublishable', () => {
  it('accepts coherent commercial terms', () => {
    expect(() => assertPublishable(pub(), NOW)).not.toThrow();
    expect(canPublish(pub(), NOW)).toBe(true);
  });
  it('rejects non-positive quantity', () => {
    expect(() => assertPublishable(pub({ quantityQtx: 0 }), NOW)).toThrow(ListingValidationError);
  });
  it('rejects minOrder above quantity', () => {
    expect(() => assertPublishable(pub({ minOrderQtx: 600 }), NOW)).toThrow(/commande minimale/i);
  });
  it('rejects non-positive price', () => {
    expect(() => assertPublishable(pub({ askPricePerQtx: 0 }), NOW)).toThrow(/prix/i);
  });
  it('rejects non-integer (fractional centimes) price', () => {
    expect(() => assertPublishable(pub({ askPricePerQtx: 40000.5 }), NOW)).toThrow(
      ListingValidationError
    );
  });
  it('rejects availability date in the past', () => {
    expect(() => assertPublishable(pub({ availableUntil: PAST }), NOW)).toThrow(/futur/i);
  });
});

describe('isExpired', () => {
  it('is true once the window has closed', () => {
    expect(isExpired(PAST, NOW)).toBe(true);
    expect(isExpired(FUTURE, NOW)).toBe(false);
  });
});
