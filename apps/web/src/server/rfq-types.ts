// Plain (non-"use server") type module — pages/components import these record
// + view types while the server-action file only exports async functions.
import type { rfqs } from '@mawsim/db/schema';

export type RfqRecord = typeof rfqs.$inferSelect;

/** A matched listing surfaced to the buyer — public fields only, no vector. */
export type RfqMatchView = {
  listingId: string;
  productCategory: string;
  productVariety: string | null;
  quantityQtx: number;
  qualityGrade: string;
  askPricePerQtx: number; // integer centimes
  region: string;
  availableUntil: string; // ISO
  certificationIds: string[];
  farmName: string;
  sellerRating: number; // 0..5
  score: number; // 0..1 re-rank score
  similarity: number; // 0..1 semantic similarity
};
