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
