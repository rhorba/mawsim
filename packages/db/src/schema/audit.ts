import { jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../utils';

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'bid',
  'agree',
  'fund',
  'release',
  'dispute',
]);

// Append-only audit log — all financial mutations must log here
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(createId),
  actorUserId: text('actor_user_id').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  action: auditActionEnum('action').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

// Access audit log — records READS of sensitive PII (farmer bank details,
// certification documents). Distinct from audit_logs (which records mutations).
// CLAUDE.md §11.1: bank details access must be audit-logged.
export const accessAuditLogs = pgTable('access_audit_logs', {
  id: text('id').primaryKey().$defaultFn(createId),
  actorUserId: text('actor_user_id').notNull(),
  actorRole: text('actor_role').notNull(),
  resource: text('resource').notNull(), // e.g. 'farmer_bank_details', 'certification_document'
  resourceId: text('resource_id').notNull(), // farmer_profile id / certification id
  action: text('action').notNull().default('read'),
  context: jsonb('context'), // optional: ip, reason
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

// In-app notifications
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id').notNull(),
  event: text('event').notNull(),
  entityId: text('entity_id').notNull(),
  data: jsonb('data'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
