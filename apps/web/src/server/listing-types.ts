// Plain (non-"use server") type module so the server-action file only exports
// async functions, while pages/components can still import this record type.
import type { listings } from '@mawsim/db/schema';

export type ListingRecord = typeof listings.$inferSelect;

/** Public, serializable listing card — no vector, no private farmer fields. */
export type PublicListingCard = {
  id: string;
  productCategory: string;
  productVariety: string | null;
  quantityQtx: number;
  minOrderQtx: number;
  qualityGrade: string;
  askPricePerQtx: number; // integer centimes
  region: string;
  harvestDate: string | null; // ISO
  availableUntil: string; // ISO
  photoKeys: string[];
  certificationCount: number;
  farmName: string;
  sellerRating: number;
  completedDeals: number;
};

export type PublicListingDetail = PublicListingCard & {
  description: string | null;
  certificationIds: string[];
  viewCount: number;
  reviewCount: number;
  createdAt: string; // ISO
};

export type PublicListingFilters = {
  productCategory?: string | undefined;
  region?: string | undefined;
  qualityGrade?: string | undefined;
  maxPricePerQtx?: number | undefined;
};
