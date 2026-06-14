import { z } from 'zod';
import type { Money } from './types.js';

// Branded money schema — validates integer centimes
export const MoneySchema = z
  .number()
  .int('Money must be integer centimes')
  .nonnegative('Money cannot be negative') as z.ZodType<Money>;

export const RoleSchema = z.enum(['farmer', 'buyer', 'logistics', 'admin']);

export const ProductCategorySchema = z.enum([
  'cereals',
  'olives',
  'dates',
  'citrus',
  'vegetables',
  'argan',
  'legumes',
  'other',
]);

export const QualityGradeSchema = z.enum(['premium', 'grade_a', 'grade_b', 'standard']);

export const MoroccanRegions = [
  'Gharb-Chrarda-Béni Hssen',
  'Souss-Massa',
  'Meknès-Tafilalet',
  'Marrakech-Safi',
  'Drâa-Tafilalet',
  'Oriental',
  'Béni Mellal-Khénifra',
  'Casablanca-Settat',
  'Rabat-Salé-Kénitra',
  'Laâyoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab',
  'Fès-Meknès',
  'Tanger-Tétouan-Al Hoceïma',
] as const;

export const RegionSchema = z.enum(MoroccanRegions);

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(2).max(100),
  role: z.enum(['farmer', 'buyer', 'logistics']),
  phone: z
    .string()
    .regex(/^(\+212|0)[5-7]\d{8}$/)
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const FarmerProfileSchema = z.object({
  farmName: z.string().min(2).max(200),
  region: RegionSchema,
  commune: z.string().max(100).optional(),
  farmSizeHa: z.number().positive().max(100000).optional(),
  products: z.array(ProductCategorySchema).min(1),
});

export const BuyerProfileSchema = z.object({
  companyName: z.string().min(2).max(200),
  ice: z
    .string()
    .regex(/^\d{15}$/, 'ICE must be 15 digits')
    .optional(),
  rc: z.string().max(50).optional(),
  sector: z.enum(['processor', 'exporter', 'distributor', 'chr', 'cooperative', 'other']),
  city: z.string().min(2).max(100),
});

export const ListingCreateSchema = z.object({
  productCategory: ProductCategorySchema,
  productVariety: z.string().max(100).optional(),
  quantityQtx: z.number().int().positive(),
  qualityGrade: QualityGradeSchema,
  askPricePerQtx: MoneySchema,
  minOrderQtx: z.number().int().positive(),
  harvestDate: z.date().optional(),
  availableUntil: z.date(),
  region: RegionSchema,
  description: z.string().max(2000).optional(),
});

export const RFQCreateSchema = z.object({
  productCategory: ProductCategorySchema,
  productVariety: z.string().max(100).optional(),
  quantityQtxMin: z.number().int().positive(),
  quantityQtxMax: z.number().int().positive(),
  maxPricePerQtx: MoneySchema.optional(),
  requiredQualityGrade: QualityGradeSchema,
  requiredCertifications: z.array(z.string()).default([]),
  deliveryRegion: RegionSchema,
  neededBy: z.date(),
  description: z.string().max(2000).optional(),
});

export const OfferSchema = z.object({
  dealId: z.string().uuid(),
  pricePerQtx: MoneySchema,
  quantityQtx: z.number().int().positive(),
  message: z.string().max(1000).optional(),
});

export const PriceAlertSchema = z.object({
  productCategory: ProductCategorySchema,
  productVariety: z.string().max(100).optional(),
  region: RegionSchema,
  thresholdPricePerQtx: MoneySchema,
  direction: z.enum(['above', 'below']),
});
