// Plain (non-"use server") type module so the negotiation server-action file
// only exports async functions, while pages/components can import these types.
import type { deals, offers } from '@mawsim/db/schema';

export type DealRecord = typeof deals.$inferSelect;
export type OfferRecord = typeof offers.$inferSelect;

/** A deal as seen by one of its parties, plus the full offer history. */
export type DealThread = {
  deal: DealRecord;
  offers: OfferRecord[];
  /** Which side the viewer is on. */
  viewerSide: 'farmer' | 'buyer' | 'admin';
  /** Display name of the *other* party (identity unlocks at deal stage). */
  counterpartyName: string;
  /** True when the standing offer was made by the counterparty (viewer's turn). */
  canRespond: boolean;
};

/** Compact row for the "my deals" list. */
export type DealSummary = {
  id: string;
  productCategory: string;
  productVariety: string | null;
  quantityQtx: number;
  pricePerQtx: number; // integer centimes — current standing terms
  totalAmount: number; // integer centimes
  deliveryRegion: string;
  deliveryDate: string; // ISO
  status: DealRecord['status'];
  counterpartyName: string;
  updatedAt: string; // ISO
};
