import { bigint, integer, pgEnum, pgTable, text, timestamp, vector } from 'drizzle-orm/pg-core';
import { createId } from '../utils';
import { buyerProfiles } from './profiles';

export const rfqStatusEnum = pgEnum('rfq_status', ['open', 'matched', 'closed']);

export const rfqs = pgTable('rfqs', {
  id: text('id').primaryKey().$defaultFn(createId),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => buyerProfiles.id, { onDelete: 'cascade' }),
  productCategory: text('product_category').notNull(),
  productVariety: text('product_variety'),
  quantityQtxMin: integer('quantity_qtx_min').notNull(),
  quantityQtxMax: integer('quantity_qtx_max').notNull(),
  // Integer centimes
  maxPricePerQtx: bigint('max_price_per_qtx', { mode: 'number' }),
  requiredQualityGrade: text('required_quality_grade').notNull(),
  requiredCertifications: text('required_certifications').array().notNull().default([]),
  deliveryRegion: text('delivery_region').notNull(),
  neededBy: timestamp('needed_by', { withTimezone: true }).notNull(),
  description: text('description'),
  status: rfqStatusEnum('status').notNull().default('open'),
  matchedListingIds: text('matched_listing_ids').array().notNull().default([]),
  // 384-dim vector for pgvector RFQ matching (ADR-01)
  productVector: vector('product_vector', { dimensions: 384 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
