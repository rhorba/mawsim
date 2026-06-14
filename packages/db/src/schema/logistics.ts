import { bigint, boolean, pgEnum, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../utils';
import { deals } from './deals';

export const truckTypeEnum = pgEnum('truck_type', ['standard', 'refrigerated', 'bulk']);

export const logisticsStatusEnum = pgEnum('logistics_status', [
  'open',
  'quoted',
  'assigned',
  'in_transit',
  'delivered',
]);

export const logisticsRequests = pgTable('logistics_requests', {
  id: text('id').primaryKey().$defaultFn(createId),
  dealId: text('deal_id')
    .notNull()
    .references(() => deals.id),
  originRegion: text('origin_region').notNull(),
  destinationRegion: text('destination_region').notNull(),
  productCategory: text('product_category').notNull(),
  weightTonnes: real('weight_tonnes').notNull(),
  truckType: truckTypeEnum('truck_type').notNull().default('standard'),
  pickupDate: timestamp('pickup_date', { withTimezone: true }).notNull(),
  urgent: boolean('urgent').notNull().default(false),
  status: logisticsStatusEnum('status').notNull().default('open'),
  assignedProviderId: text('assigned_provider_id'),
  agreedPrice: bigint('agreed_price', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const logisticsQuotes = pgTable('logistics_quotes', {
  id: text('id').primaryKey().$defaultFn(createId),
  requestId: text('request_id')
    .notNull()
    .references(() => logisticsRequests.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  priceQuoted: bigint('price_quoted', { mode: 'number' }).notNull(),
  availableFrom: timestamp('available_from', { withTimezone: true }),
  message: text('message'),
  accepted: boolean('accepted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const priceAlerts = pgTable('price_alerts', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id').notNull(),
  productCategory: text('product_category').notNull(),
  productVariety: text('product_variety'),
  region: text('region').notNull(),
  thresholdPricePerQtx: bigint('threshold_price_per_qtx', { mode: 'number' }).notNull(),
  direction: text('direction').notNull(), // 'above' | 'below'
  active: boolean('active').notNull().default(true),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
