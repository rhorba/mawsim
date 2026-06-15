import type { Money } from '@mawsim/core';

// Negotiation engine — pure, DB-free logic for the offer/counter-offer dance.
// Persistence + RLS live in the web server-action layer; the strict status
// transitions live in deal-machine.ts. This module owns the turn-taking rule
// and the deal-total arithmetic so they can be unit-tested in isolation.

export class NegotiationError extends Error {
  constructor(message: string) {
    super(message);
    // Name is whitelisted in the web action layer so the message is shown to
    // the user (FR-facing), like ListingTransitionError / DealTransitionError.
    this.name = 'NegotiationError';
  }
}

/** Line total for an offer: integer centimes/qtx × quintaux → integer centimes. */
export function offerTotal(pricePerQtx: Money, quantityQtx: number): Money {
  if (!Number.isInteger(pricePerQtx) || pricePerQtx < 0) {
    throw new NegotiationError('Prix invalide.');
  }
  if (!Number.isInteger(quantityQtx) || quantityQtx <= 0) {
    throw new NegotiationError('Quantité invalide.');
  }
  return pricePerQtx * quantityQtx;
}

/**
 * A counter-offer or an acceptance always acts on the *other* party's standing
 * offer — you cannot counter or accept your own offer (that would let one side
 * close a deal unilaterally). The caller proves party membership separately
 * (profile-id ownership + deal-row RLS visibility); this guards the turn.
 *
 * @param lastOfferAuthorUserId author of the most recent offer on the deal
 * @param actingUserId          the user attempting to counter / accept
 */
export function assertCanRespond(lastOfferAuthorUserId: string, actingUserId: string): void {
  if (actingUserId === lastOfferAuthorUserId) {
    throw new NegotiationError("C'est au tour de l'autre partie de répondre.");
  }
}
