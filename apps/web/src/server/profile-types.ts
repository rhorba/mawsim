// Plain (non-"use server") type module so server-action files only export
// async functions, while pages/components can still import these record types.
import type { buyerProfiles, farmerCertifications, farmerProfiles } from '@mawsim/db/schema';

export type FarmerProfileRecord = typeof farmerProfiles.$inferSelect;
export type FarmerCertificationRecord = typeof farmerCertifications.$inferSelect;
export type BuyerProfileRecord = typeof buyerProfiles.$inferSelect;
