import type { ListingStatus } from '@mawsim/core';

// Listing lifecycle — strict, mirrors the deal machine philosophy.
const LISTING_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['negotiating', 'sold', 'expired', 'cancelled'],
  negotiating: ['active', 'sold', 'cancelled'],
  sold: [],
  expired: ['active'], // farmer may relist by extending availability
  cancelled: [],
};

export class ListingTransitionError extends Error {
  constructor(from: ListingStatus, to: ListingStatus) {
    super(`Invalid listing transition: ${from} → ${to}`);
    this.name = 'ListingTransitionError';
  }
}

export class ListingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ListingValidationError';
  }
}

export function canTransitionListing(from: ListingStatus, to: ListingStatus): boolean {
  return (LISTING_TRANSITIONS[from] ?? []).includes(to);
}

export function assertListingTransition(from: ListingStatus, to: ListingStatus): void {
  if (!canTransitionListing(from, to)) {
    throw new ListingTransitionError(from, to);
  }
}

export type PublishableListing = {
  quantityQtx: number;
  minOrderQtx: number;
  askPricePerQtx: number; // integer centimes
  availableUntil: Date;
};

/**
 * A listing may only go `active` (be publicly browsable) when its commercial
 * terms are coherent. Throws ListingValidationError on the first violation.
 */
export function assertPublishable(listing: PublishableListing, now: Date = new Date()): void {
  if (!Number.isInteger(listing.quantityQtx) || listing.quantityQtx <= 0) {
    throw new ListingValidationError('La quantité doit être un entier positif (quintaux).');
  }
  if (!Number.isInteger(listing.minOrderQtx) || listing.minOrderQtx <= 0) {
    throw new ListingValidationError('La commande minimale doit être un entier positif.');
  }
  if (listing.minOrderQtx > listing.quantityQtx) {
    throw new ListingValidationError(
      'La commande minimale ne peut pas dépasser la quantité disponible.'
    );
  }
  if (!Number.isInteger(listing.askPricePerQtx) || listing.askPricePerQtx <= 0) {
    throw new ListingValidationError('Le prix doit être un entier positif (centimes MAD).');
  }
  if (listing.availableUntil.getTime() <= now.getTime()) {
    throw new ListingValidationError('La date de disponibilité doit être dans le futur.');
  }
}

export function canPublish(listing: PublishableListing, now: Date = new Date()): boolean {
  try {
    assertPublishable(listing, now);
    return true;
  } catch {
    return false;
  }
}

/** True once a listing's availability window has closed. */
export function isExpired(availableUntil: Date, now: Date = new Date()): boolean {
  return availableUntil.getTime() <= now.getTime();
}
