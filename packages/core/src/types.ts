// Core domain types for Mawsim — integer centimes only, never floats

export type Money = number; // MAD in integer centimes

export type Role = 'farmer' | 'buyer' | 'logistics' | 'admin';

export type ProductCategory =
  | 'cereals'
  | 'olives'
  | 'dates'
  | 'citrus'
  | 'vegetables'
  | 'argan'
  | 'legumes'
  | 'other';

export type QualityGrade = 'premium' | 'grade_a' | 'grade_b' | 'standard';

export type ListingStatus = 'draft' | 'active' | 'negotiating' | 'sold' | 'expired' | 'cancelled';

export type DealStatus =
  | 'offer_made'
  | 'negotiating'
  | 'agreed'
  | 'contract_signed'
  | 'escrow_funded'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type EscrowStatus =
  | 'pending'
  | 'deposit_paid'
  | 'fully_funded'
  | 'released'
  | 'refunded'
  | 'disputed';

export type LogisticsStatus = 'open' | 'quoted' | 'assigned' | 'in_transit' | 'delivered';

export type CertificationType = 'organic' | 'global_gap' | 'label_maroc' | 'fair_trade' | 'other';

export type BuyerSector =
  | 'processor'
  | 'exporter'
  | 'distributor'
  | 'chr'
  | 'cooperative'
  | 'other';

export type PriceSource = 'mawsim_transaction' | 'onicl' | 'admin_manual';

export type TruckType = 'standard' | 'refrigerated' | 'bulk';

export type AuditAction = 'create' | 'update' | 'bid' | 'agree' | 'fund' | 'release' | 'dispute';

export type BankDetails = {
  bankName: string;
  rib: string; // Moroccan RIB (24 digits)
  accountHolder: string;
  iban?: string; // optional international format
};

export type ReviewerRole = 'farmer' | 'buyer';

export type RFQStatus = 'open' | 'matched' | 'closed';

export interface Session {
  userId: string;
  role: Role;
  email: string;
  name: string;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'ERROR'; error: string };
