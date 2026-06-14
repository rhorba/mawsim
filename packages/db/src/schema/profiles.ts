import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createId } from '../utils';
import { users } from './users';

export const certificationTypeEnum = pgEnum('certification_type', [
  'organic',
  'global_gap',
  'label_maroc',
  'fair_trade',
  'other',
]);

export const buyerSectorEnum = pgEnum('buyer_sector', [
  'processor',
  'exporter',
  'distributor',
  'chr',
  'cooperative',
  'other',
]);

export const farmerProfiles = pgTable('farmer_profiles', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  farmName: text('farm_name').notNull(),
  region: text('region').notNull(),
  commune: text('commune'),
  farmSizeHa: real('farm_size_ha'),
  products: text('products').array().notNull().default([]),
  // bankDetails stored encrypted — see bank_details_encrypted column
  bankDetailsEncrypted: text('bank_details_encrypted'),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  completedDeals: integer('completed_deals').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const farmerCertifications = pgTable('farmer_certifications', {
  id: text('id').primaryKey().$defaultFn(createId),
  farmerId: text('farmer_id')
    .notNull()
    .references(() => farmerProfiles.id, { onDelete: 'cascade' }),
  type: certificationTypeEnum('type').notNull(),
  issuedBy: text('issued_by').notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
  documentKey: text('document_key').notNull(),
  verified: boolean('verified').notNull().default(false),
  adminNote: text('admin_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const buyerProfiles = pgTable('buyer_profiles', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  ice: text('ice'),
  rc: text('rc'),
  sector: buyerSectorEnum('sector').notNull(),
  city: text('city').notNull(),
  verifiedBusiness: boolean('verified_business').notNull().default(false),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  completedDeals: integer('completed_deals').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const logisticsProfiles = pgTable('logistics_profiles', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  phone: text('phone').notNull(),
  region: text('region').notNull(),
  truckTypes: text('truck_types').array().notNull().default([]),
  verified: boolean('verified').notNull().default(false),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
