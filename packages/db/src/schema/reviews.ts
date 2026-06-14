import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../utils';
import { deals } from './deals';

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().$defaultFn(createId),
  dealId: text('deal_id')
    .notNull()
    .references(() => deals.id),
  reviewerId: text('reviewer_id').notNull(),
  revieweeId: text('reviewee_id').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  reviewerRole: text('reviewer_role').notNull(), // 'farmer' | 'buyer'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
