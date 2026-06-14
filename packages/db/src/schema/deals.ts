import { bigint, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../utils';
import { buyerProfiles, farmerProfiles } from './profiles';

export const dealStatusEnum = pgEnum('deal_status', [
  'offer_made',
  'negotiating',
  'agreed',
  'contract_signed',
  'escrow_funded',
  'in_transit',
  'delivered',
  'completed',
  'disputed',
  'cancelled',
]);

export const deals = pgTable('deals', {
  id: text('id').primaryKey().$defaultFn(createId),
  listingId: text('listing_id'),
  rfqId: text('rfq_id'),
  farmerId: text('farmer_id')
    .notNull()
    .references(() => farmerProfiles.id),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => buyerProfiles.id),
  productCategory: text('product_category').notNull(),
  productVariety: text('product_variety'),
  quantityQtx: integer('quantity_qtx').notNull(),
  // Integer centimes
  agreedPricePerQtx: bigint('agreed_price_per_qtx', { mode: 'number' }).notNull(),
  totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
  deliveryRegion: text('delivery_region').notNull(),
  deliveryDate: timestamp('delivery_date', { withTimezone: true }).notNull(),
  status: dealStatusEnum('status').notNull().default('offer_made'),
  contractKey: text('contract_key'),
  logisticsRequestId: text('logistics_request_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const offers = pgTable('offers', {
  id: text('id').primaryKey().$defaultFn(createId),
  dealId: text('deal_id')
    .notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id').notNull(),
  pricePerQtx: bigint('price_per_qtx', { mode: 'number' }).notNull(),
  quantityQtx: integer('quantity_qtx').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
