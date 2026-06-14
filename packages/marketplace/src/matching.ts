import type { ProductCategory, QualityGrade } from '@mawsim/core';
import { cosineSimilarity } from './embedding.js';

// Quality ordering: a listing satisfies an RFQ only if its grade is at least
// as good as the buyer requires. premium > grade_a > grade_b > standard.
const GRADE_RANK: Record<QualityGrade, number> = {
  premium: 3,
  grade_a: 2,
  grade_b: 1,
  standard: 0,
};

export function gradeRank(grade: QualityGrade): number {
  return GRADE_RANK[grade];
}

export type RfqCriteria = {
  productCategory: ProductCategory;
  quantityQtxMin: number;
  quantityQtxMax: number;
  maxPricePerQtx?: number | null; // integer centimes
  requiredQualityGrade: QualityGrade;
  requiredCertifications: string[];
  deliveryRegion: string;
  productVector?: number[] | null;
};

export type MatchableListing = {
  id: string;
  productCategory: ProductCategory;
  quantityQtx: number;
  askPricePerQtx: number; // integer centimes
  qualityGrade: QualityGrade;
  certificationIds: string[];
  region: string;
  status: string;
  availableUntil: Date;
  productVector?: number[] | null;
};

/**
 * Hard eligibility gate — a listing must clear ALL of these to be a candidate.
 * These are exact business rules, never approximated by the vector.
 */
export function rfqHardFilter(
  rfq: RfqCriteria,
  listing: MatchableListing,
  now: Date = new Date()
): boolean {
  if (listing.status !== 'active') return false;
  if (listing.availableUntil.getTime() <= now.getTime()) return false;
  if (listing.productCategory !== rfq.productCategory) return false;
  if (gradeRank(listing.qualityGrade) < gradeRank(rfq.requiredQualityGrade)) return false;
  // Listing must be able to supply at least the buyer's minimum.
  if (listing.quantityQtx < rfq.quantityQtxMin) return false;
  if (rfq.maxPricePerQtx != null && listing.askPricePerQtx > rfq.maxPricePerQtx) return false;
  // Every required certification must be present on the listing.
  for (const cert of rfq.requiredCertifications) {
    if (!listing.certificationIds.includes(cert)) return false;
  }
  return true;
}

/**
 * Soft relevance score in [0,1] for ranking eligible candidates. Combines
 * semantic similarity (vector) with a same-region delivery bonus. Region match
 * matters because it cuts logistics cost — but it never gates eligibility.
 */
export function scoreMatch(rfq: RfqCriteria, listing: MatchableListing): number {
  let semantic = 0.5; // neutral prior when vectors are absent
  if (rfq.productVector && listing.productVector) {
    // cosine ∈ [-1,1] → map to [0,1]
    semantic = (cosineSimilarity(rfq.productVector, listing.productVector) + 1) / 2;
  }
  const regionBonus = listing.region === rfq.deliveryRegion ? 1 : 0;
  return 0.8 * semantic + 0.2 * regionBonus;
}

export type RankedMatch = { listing: MatchableListing; score: number };

/**
 * In-memory match + rank. The production path narrows candidates in Postgres
 * (pgvector `<=>` + WHERE filters); this pure function is the source of truth
 * for the ranking rules and is what the matching tests exercise.
 */
export function matchRfq(
  rfq: RfqCriteria,
  listings: MatchableListing[],
  opts: { now?: Date; limit?: number } = {}
): RankedMatch[] {
  const now = opts.now ?? new Date();
  const ranked = listings
    .filter((l) => rfqHardFilter(rfq, l, now))
    .map((listing) => ({ listing, score: scoreMatch(rfq, listing) }))
    .sort((a, b) => b.score - a.score);
  return opts.limit ? ranked.slice(0, opts.limit) : ranked;
}
