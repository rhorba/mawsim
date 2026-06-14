import { bigint, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../utils';

export const priceSourceEnum = pgEnum('price_source', [
  'mawsim_transaction',
  'onicl',
  'admin_manual',
]);

export const pricePoints = pgTable('price_points', {
  id: text('id').primaryKey().$defaultFn(createId),
  productCategory: text('product_category').notNull(),
  productVariety: text('product_variety'),
  region: text('region').notNull(),
  // Integer centimes per quintal
  pricePerQtx: bigint('price_per_qtx', { mode: 'number' }).notNull(),
  source: priceSourceEnum('source').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});
