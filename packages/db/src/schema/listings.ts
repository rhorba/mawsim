import { bigint, integer, pgEnum, pgTable, text, timestamp, vector } from 'drizzle-orm/pg-core';
import { createId } from '../utils';
import { farmerProfiles } from './profiles';

export const productCategoryEnum = pgEnum('product_category', [
  'cereals',
  'olives',
  'dates',
  'citrus',
  'vegetables',
  'argan',
  'legumes',
  'other',
]);

export const qualityGradeEnum = pgEnum('quality_grade', [
  'premium',
  'grade_a',
  'grade_b',
  'standard',
]);

export const listingStatusEnum = pgEnum('listing_status', [
  'draft',
  'active',
  'negotiating',
  'sold',
  'expired',
  'cancelled',
]);

export const listings = pgTable('listings', {
  id: text('id').primaryKey().$defaultFn(createId),
  farmerId: text('farmer_id')
    .notNull()
    .references(() => farmerProfiles.id, { onDelete: 'cascade' }),
  productCategory: productCategoryEnum('product_category').notNull(),
  productVariety: text('product_variety'),
  quantityQtx: integer('quantity_qtx').notNull(),
  qualityGrade: qualityGradeEnum('quality_grade').notNull(),
  // Integer centimes (MAD). NEVER a float.
  askPricePerQtx: bigint('ask_price_per_qtx', { mode: 'number' }).notNull(),
  minOrderQtx: integer('min_order_qtx').notNull().default(1),
  harvestDate: timestamp('harvest_date', { withTimezone: true }),
  availableUntil: timestamp('available_until', { withTimezone: true }).notNull(),
  region: text('region').notNull(),
  description: text('description'),
  photoKeys: text('photo_keys').array().notNull().default([]),
  certificationIds: text('certification_ids').array().notNull().default([]),
  status: listingStatusEnum('status').notNull().default('draft'),
  viewCount: integer('view_count').notNull().default(0),
  // 384-dim vector for pgvector RFQ matching (ADR-01)
  productVector: vector('product_vector', { dimensions: 384 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
