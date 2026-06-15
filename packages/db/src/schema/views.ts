import { integer, numeric, pgView, text } from 'drizzle-orm/pg-core';

// Public, read-only projection of farmer_profiles — SAFE columns only. Created
// by migration 0003 (`.existing()` = drizzle does not manage its DDL). The view
// deliberately omits `bank_details_encrypted`: the marketplace (public listing
// browse + buyer RFQ matches) joins this instead of the RLS-protected table, so
// farmer bank details can never leak through a public/marketplace query.
export const farmerPublicProfiles = pgView('farmer_public_profiles', {
  id: text('id').notNull(),
  farmName: text('farm_name').notNull(),
  region: text('region').notNull(),
  commune: text('commune'),
  avgRating: numeric('avg_rating'),
  reviewCount: integer('review_count').notNull(),
  completedDeals: integer('completed_deals').notNull(),
}).existing();
