import { bigint, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../utils';
import { deals } from './deals';
import { buyerProfiles, farmerProfiles } from './profiles';

export const escrowStatusEnum = pgEnum('escrow_status', [
  'pending',
  'deposit_paid',
  'fully_funded',
  'released',
  'refunded',
  'disputed',
]);

export const escrows = pgTable('escrows', {
  id: text('id').primaryKey().$defaultFn(createId),
  dealId: text('deal_id')
    .notNull()
    .unique()
    .references(() => deals.id),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => buyerProfiles.id),
  farmerId: text('farmer_id')
    .notNull()
    .references(() => farmerProfiles.id),
  // All amounts in integer centimes
  grossAmount: bigint('gross_amount', { mode: 'number' }).notNull(),
  deposit: bigint('deposit', { mode: 'number' }).notNull(), // 30%
  remainder: bigint('remainder', { mode: 'number' }).notNull(), // 70%
  platformFeeFromBuyer: bigint('platform_fee_from_buyer', { mode: 'number' }).notNull(), // 2.5%
  platformFeeFromFarmer: bigint('platform_fee_from_farmer', { mode: 'number' }).notNull(), // 1.5%
  farmerPayout: bigint('farmer_payout', { mode: 'number' }).notNull(),
  status: escrowStatusEnum('status').notNull().default('pending'),
  depositPaidAt: timestamp('deposit_paid_at', { withTimezone: true }),
  fullyFundedAt: timestamp('fully_funded_at', { withTimezone: true }),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
