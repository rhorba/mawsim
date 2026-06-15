// Plain (non-"use server") type module so the server-action file only exports
// async functions, while pages/components can still import this record type.
import type { listings } from '@mawsim/db/schema';

export type ListingRecord = typeof listings.$inferSelect;
