// Public marketplace reads — NO auth, NO user context. Runs as the app role with
// RLS in effect: `listings_select` exposes status='active' rows to everyone and
// `farmer_profiles_public_select` (migration 0003) exposes farmer PUBLIC fields.
// We deliberately select only public columns — never bank_details_encrypted.
import type { ProductCategory, QualityGrade } from '@mawsim/core';
import { db } from '@mawsim/db';
import { farmerProfiles, listings } from '@mawsim/db/schema';
import { type SQL, and, desc, eq, gt, lte } from 'drizzle-orm';
import type { PublicListingCard, PublicListingDetail, PublicListingFilters } from './listing-types';

const publicColumns = {
  id: listings.id,
  productCategory: listings.productCategory,
  productVariety: listings.productVariety,
  quantityQtx: listings.quantityQtx,
  minOrderQtx: listings.minOrderQtx,
  qualityGrade: listings.qualityGrade,
  askPricePerQtx: listings.askPricePerQtx,
  region: listings.region,
  harvestDate: listings.harvestDate,
  availableUntil: listings.availableUntil,
  photoKeys: listings.photoKeys,
  certificationIds: listings.certificationIds,
  description: listings.description,
  viewCount: listings.viewCount,
  createdAt: listings.createdAt,
  farmName: farmerProfiles.farmName,
  sellerRating: farmerProfiles.avgRating,
  reviewCount: farmerProfiles.reviewCount,
  completedDeals: farmerProfiles.completedDeals,
};

type Row = {
  id: string;
  productCategory: string;
  productVariety: string | null;
  quantityQtx: number;
  minOrderQtx: number;
  qualityGrade: string;
  askPricePerQtx: number;
  region: string;
  harvestDate: Date | null;
  availableUntil: Date;
  photoKeys: string[];
  certificationIds: string[];
  description: string | null;
  viewCount: number;
  createdAt: Date;
  farmName: string;
  sellerRating: string; // numeric → string from pg
  reviewCount: number;
  completedDeals: number;
};

function toCard(r: Row): PublicListingCard {
  return {
    id: r.id,
    productCategory: r.productCategory,
    productVariety: r.productVariety,
    quantityQtx: r.quantityQtx,
    minOrderQtx: r.minOrderQtx,
    qualityGrade: r.qualityGrade,
    askPricePerQtx: r.askPricePerQtx,
    region: r.region,
    harvestDate: r.harvestDate ? r.harvestDate.toISOString() : null,
    availableUntil: r.availableUntil.toISOString(),
    photoKeys: r.photoKeys,
    certificationCount: r.certificationIds.length,
    farmName: r.farmName,
    sellerRating: Number(r.sellerRating),
    completedDeals: r.completedDeals,
  };
}

/** Browse active, in-window listings with optional facet filters. SSR/public. */
export async function browsePublicListings(
  filters: PublicListingFilters = {}
): Promise<PublicListingCard[]> {
  const conditions: SQL[] = [
    eq(listings.status, 'active'),
    gt(listings.availableUntil, new Date()),
  ];

  if (filters.productCategory) {
    conditions.push(eq(listings.productCategory, filters.productCategory as ProductCategory));
  }
  if (filters.region) conditions.push(eq(listings.region, filters.region));
  if (filters.qualityGrade) {
    conditions.push(eq(listings.qualityGrade, filters.qualityGrade as QualityGrade));
  }
  if (filters.maxPricePerQtx && filters.maxPricePerQtx > 0) {
    conditions.push(lte(listings.askPricePerQtx, filters.maxPricePerQtx));
  }

  const rows = await db
    .select(publicColumns)
    .from(listings)
    .innerJoin(farmerProfiles, eq(listings.farmerId, farmerProfiles.id))
    .where(and(...conditions))
    .orderBy(desc(listings.createdAt))
    .limit(60);

  return (rows as Row[]).map(toCard);
}

/** A single active listing for the public detail page, or null. */
export async function getPublicListing(id: string): Promise<PublicListingDetail | null> {
  const [row] = await db
    .select(publicColumns)
    .from(listings)
    .innerJoin(farmerProfiles, eq(listings.farmerId, farmerProfiles.id))
    .where(and(eq(listings.id, id), eq(listings.status, 'active')))
    .limit(1);

  if (!row) return null;
  const r = row as Row;
  return {
    ...toCard(r),
    description: r.description,
    certificationIds: r.certificationIds,
    viewCount: r.viewCount,
    reviewCount: r.reviewCount,
    createdAt: r.createdAt.toISOString(),
  };
}
