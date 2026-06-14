/**
 * Mawsim demo seed — Sprint 1 (S1-08).
 *
 * Populates a realistic demo dataset:
 *   6 farmers · 4 buyers · 2 logistics providers
 *   12 listings (with pgvector embeddings) · 4 RFQs
 *   6 deals (2 completed + reviews + released escrow, 2 in_transit, 2 negotiating)
 *   6 months of price history for the top 5 products · 2 price alerts
 *
 * Demo accounts (password: demo1234):
 *   mehdi.fellah@demo.mawsim.ma  — wheat farmer, Meknès
 *   atlas.food@demo.mawsim.ma    — IAA processor, Casablanca
 *
 * Run: pnpm --filter @mawsim/db run seed   (DATABASE_URL must point at the DB)
 *
 * The seed connects as the migration owner (not mawsim_app), so RLS does not
 * block inserts. Money is ALWAYS integer centimes (see @mawsim/core).
 */
import { computeEscrowSplit, computeFees, toMoney } from '@mawsim/core';
import * as argon2 from 'argon2';
import { sql } from 'drizzle-orm';
import { db } from './client';
import {
  buyerProfiles,
  deals,
  escrows,
  farmerCertifications,
  farmerProfiles,
  listings,
  logisticsProfiles,
  logisticsQuotes,
  logisticsRequests,
  priceAlerts,
  pricePoints,
  reviews,
  rfqs,
  users,
} from './schema/index';
import { createId } from './utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * DAY);
const daysAhead = (d: number) => new Date(now + d * DAY);

const VEC_DIMS = 384;

/** Deterministic pseudo-random unit vector seeded from a string (LCG). */
function seededVector(text: string, dims = VEC_DIMS): number[] {
  let seed = 0;
  for (const ch of text) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  let x = seed || 1;
  const v: number[] = new Array(dims);
  for (let i = 0; i < dims; i++) {
    x = (1103515245 * x + 12345) & 0x7fffffff; // LCG
    v[i] = (x / 0x7fffffff) * 2 - 1;
  }
  const norm = Math.sqrt(v.reduce((s, c) => s + c * c, 0)) || 1;
  return v.map((c) => c / norm);
}

/**
 * Category-dominant 384-dim embedding: the category component dominates (weight 1)
 * with a small variety perturbation (weight 0.15). Same-category listings/RFQs
 * land at cosine ≈ 0.98, exact-variety matches at 1.0, different categories ≈ 0.
 * This makes pgvector RFQ matching work out-of-the-box on demo data. Real
 * embeddings are computed by the market engine in production.
 */
function productEmbedding(category: string, variety: string): number[] {
  const cat = seededVector(`cat:${category}`);
  const varv = seededVector(`var:${variety}`);
  const blended = cat.map((c, i) => c + 0.15 * (varv[i] as number));
  const norm = Math.sqrt(blended.reduce((s, c) => s + c * c, 0)) || 1;
  return blended.map((c) => c / norm);
}

async function main() {
  console.log('🌱 Seeding Mawsim demo data…');

  // All demo accounts share this password.
  const passwordHash = await argon2.hash('demo1234', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
  const verified = daysAgo(120); // emailVerified timestamp (non-null = verified)

  // -------------------------------------------------------------------------
  // Reset (idempotent). CASCADE clears dependent rows.
  // -------------------------------------------------------------------------
  await db.execute(sql`
    TRUNCATE TABLE
      reviews, escrows, logistics_quotes, logistics_requests, deals,
      rfqs, listings, farmer_certifications, price_alerts, price_points,
      notifications, audit_logs, access_audit_logs,
      farmer_profiles, buyer_profiles, logistics_profiles,
      accounts, sessions, users
    RESTART IDENTITY CASCADE
  `);

  // -------------------------------------------------------------------------
  // Farmers (6) — each: user + farmer_profile
  // -------------------------------------------------------------------------
  type FarmerSpec = {
    key: string;
    email: string;
    name: string;
    farmName: string;
    region: string;
    commune: string;
    city: string;
    farmSizeHa: number;
    products: string[];
    rating: string;
    reviews: number;
    deals: number;
  };

  const farmerSpecs: FarmerSpec[] = [
    {
      key: 'mehdi',
      email: 'mehdi.fellah@demo.mawsim.ma',
      name: 'Mehdi El Fellah',
      farmName: 'Ferme El Fellah',
      region: 'Fès-Meknès',
      commune: 'Meknès',
      city: 'Meknès',
      farmSizeHa: 28,
      products: ['cereals', 'legumes'],
      rating: '4.70',
      reviews: 12,
      deals: 9,
    },
    {
      key: 'aicha',
      email: 'aicha.olives@demo.mawsim.ma',
      name: 'Aicha Benhammou',
      farmName: 'Domaine Zitoun',
      region: 'Marrakech-Safi',
      commune: 'Marrakech',
      city: 'Marrakech',
      farmSizeHa: 15,
      products: ['olives'],
      rating: '4.50',
      reviews: 8,
      deals: 6,
    },
    {
      key: 'brahim',
      email: 'brahim.dates@demo.mawsim.ma',
      name: 'Brahim Ait Oudghir',
      farmName: 'Oasis Tafilalet',
      region: 'Drâa-Tafilalet',
      commune: 'Errachidia',
      city: 'Errachidia',
      farmSizeHa: 9,
      products: ['dates'],
      rating: '4.90',
      reviews: 21,
      deals: 14,
    },
    {
      key: 'youssef',
      email: 'youssef.citrus@demo.mawsim.ma',
      name: 'Youssef Amrani',
      farmName: 'Vergers du Souss',
      region: 'Souss-Massa',
      commune: 'Taroudant',
      city: 'Taroudant',
      farmSizeHa: 42,
      products: ['citrus'],
      rating: '4.30',
      reviews: 6,
      deals: 5,
    },
    {
      key: 'fatima',
      email: 'fatima.veg@demo.mawsim.ma',
      name: 'Fatima Zahra Idrissi',
      farmName: 'Primeurs Agadir',
      region: 'Souss-Massa',
      commune: 'Agadir',
      city: 'Agadir',
      farmSizeHa: 12,
      products: ['vegetables'],
      rating: '4.10',
      reviews: 4,
      deals: 3,
    },
    {
      key: 'hassan',
      email: 'hassan.argan@demo.mawsim.ma',
      name: 'Hassan Oubella',
      farmName: 'Coopérative Argan Essaouira',
      region: 'Marrakech-Safi',
      commune: 'Essaouira',
      city: 'Essaouira',
      farmSizeHa: 20,
      products: ['argan'],
      rating: '4.80',
      reviews: 10,
      deals: 7,
    },
  ];

  const farmerUserIds: Record<string, string> = {};
  const farmerProfileIds: Record<string, string> = {};

  for (const f of farmerSpecs) {
    const userId = createId();
    const profileId = createId();
    farmerUserIds[f.key] = userId;
    farmerProfileIds[f.key] = profileId;

    await db.insert(users).values({
      id: userId,
      email: f.email,
      name: f.name,
      role: 'farmer',
      region: f.region,
      city: f.city,
      passwordHash,
      emailVerified: verified,
      isActive: true,
      createdAt: daysAgo(120),
    });

    await db.insert(farmerProfiles).values({
      id: profileId,
      userId,
      farmName: f.farmName,
      region: f.region,
      commune: f.commune,
      farmSizeHa: f.farmSizeHa,
      products: f.products,
      avgRating: f.rating,
      reviewCount: f.reviews,
      completedDeals: f.deals,
      createdAt: daysAgo(120),
    });
  }

  // A verified organic certification for the dates farmer (cert doc in private R2).
  await db.insert(farmerCertifications).values({
    id: createId(),
    farmerId: farmerProfileIds['brahim'] as string,
    type: 'organic',
    issuedBy: 'Ecocert Maroc',
    validUntil: daysAhead(300),
    documentKey: 'certifications/brahim/organic-2026.pdf',
    verified: true,
    adminNote: 'Vérifié — Ecocert valide jusqu’en 2027.',
  });

  // -------------------------------------------------------------------------
  // Buyers (4) — each: user + buyer_profile
  // -------------------------------------------------------------------------
  type BuyerSpec = {
    key: string;
    email: string;
    name: string;
    companyName: string;
    sector: 'processor' | 'exporter' | 'distributor' | 'chr' | 'cooperative' | 'other';
    city: string;
    region: string;
    ice: string;
    rc: string;
    verified: boolean;
    rating: string;
    reviews: number;
    deals: number;
  };

  const buyerSpecs: BuyerSpec[] = [
    {
      key: 'atlas',
      email: 'atlas.food@demo.mawsim.ma',
      name: 'Atlas Food Industries',
      companyName: 'Atlas Food Industries SA',
      sector: 'processor',
      city: 'Casablanca',
      region: 'Casablanca-Settat',
      ice: '001789456000023',
      rc: 'RC-CASA-145236',
      verified: true,
      rating: '4.60',
      reviews: 18,
      deals: 31,
    },
    {
      key: 'medexport',
      email: 'medexport@demo.mawsim.ma',
      name: 'Med Export',
      companyName: 'Méditerranée Export SARL',
      sector: 'exporter',
      city: 'Tanger',
      region: 'Tanger-Tétouan-Al Hoceïma',
      ice: '002456789000041',
      rc: 'RC-TNG-98741',
      verified: true,
      rating: '4.40',
      reviews: 11,
      deals: 22,
    },
    {
      key: 'coopmeknes',
      email: 'coop.meknes@demo.mawsim.ma',
      name: 'Coopérative Agricole Meknès',
      companyName: 'Coopérative Agricole de Meknès',
      sector: 'cooperative',
      city: 'Meknès',
      region: 'Fès-Meknès',
      ice: '003111222000033',
      rc: 'RC-MKN-33012',
      verified: true,
      rating: '4.20',
      reviews: 7,
      deals: 13,
    },
    {
      key: 'riad',
      email: 'riad.hotels@demo.mawsim.ma',
      name: 'Riad Hotels Group',
      companyName: 'Riad Hotels & Restaurants Group',
      sector: 'chr',
      city: 'Rabat',
      region: 'Rabat-Salé-Kénitra',
      ice: '004555666000017',
      rc: 'RC-RBA-77451',
      verified: false,
      rating: '4.00',
      reviews: 3,
      deals: 4,
    },
  ];

  const buyerUserIds: Record<string, string> = {};
  const buyerProfileIds: Record<string, string> = {};

  for (const b of buyerSpecs) {
    const userId = createId();
    const profileId = createId();
    buyerUserIds[b.key] = userId;
    buyerProfileIds[b.key] = profileId;

    await db.insert(users).values({
      id: userId,
      email: b.email,
      name: b.name,
      role: 'buyer',
      region: b.region,
      city: b.city,
      passwordHash,
      emailVerified: verified,
      isActive: true,
      createdAt: daysAgo(110),
    });

    await db.insert(buyerProfiles).values({
      id: profileId,
      userId,
      companyName: b.companyName,
      ice: b.ice,
      rc: b.rc,
      sector: b.sector,
      city: b.city,
      verifiedBusiness: b.verified,
      avgRating: b.rating,
      reviewCount: b.reviews,
      completedDeals: b.deals,
      createdAt: daysAgo(110),
    });
  }

  // -------------------------------------------------------------------------
  // Logistics providers (2)
  // -------------------------------------------------------------------------
  type LogiSpec = {
    key: string;
    email: string;
    name: string;
    companyName: string;
    phone: string;
    region: string;
    truckTypes: string[];
    verified: boolean;
    rating: string;
    reviews: number;
  };

  const logiSpecs: LogiSpec[] = [
    {
      key: 'transatlas',
      email: 'trans.atlas@demo.mawsim.ma',
      name: 'Trans Atlas Logistique',
      companyName: 'Trans Atlas Logistique SARL',
      phone: '+212661234567',
      region: 'Fès-Meknès',
      truckTypes: ['standard', 'bulk'],
      verified: true,
      rating: '4.50',
      reviews: 9,
    },
    {
      key: 'coldsud',
      email: 'cold.sud@demo.mawsim.ma',
      name: 'Cold Chain Sud',
      companyName: 'Cold Chain Sud SA',
      phone: '+212662345678',
      region: 'Souss-Massa',
      truckTypes: ['refrigerated', 'standard'],
      verified: true,
      rating: '4.70',
      reviews: 14,
    },
  ];

  const logiUserIds: Record<string, string> = {};
  const logiProfileIds: Record<string, string> = {};

  for (const l of logiSpecs) {
    const userId = createId();
    const profileId = createId();
    logiUserIds[l.key] = userId;
    logiProfileIds[l.key] = profileId;

    await db.insert(users).values({
      id: userId,
      email: l.email,
      name: l.name,
      role: 'logistics',
      region: l.region,
      passwordHash,
      emailVerified: verified,
      isActive: true,
      createdAt: daysAgo(100),
    });

    await db.insert(logisticsProfiles).values({
      id: profileId,
      userId,
      companyName: l.companyName,
      phone: l.phone,
      region: l.region,
      truckTypes: l.truckTypes,
      verified: l.verified,
      avgRating: l.rating,
      reviewCount: l.reviews,
      createdAt: daysAgo(100),
    });
  }

  // -------------------------------------------------------------------------
  // Listings (12) — prices are MAD/quintal via toMoney(); stored as centimes.
  // -------------------------------------------------------------------------
  type ListingSpec = {
    farmer: string;
    category: 'cereals' | 'olives' | 'dates' | 'citrus' | 'vegetables' | 'argan' | 'legumes';
    variety: string;
    qtx: number;
    grade: 'premium' | 'grade_a' | 'grade_b' | 'standard';
    priceMad: number;
    minOrder: number;
    region: string;
    status: 'active' | 'negotiating' | 'sold' | 'draft';
    harvestDaysAgo?: number;
    untilDaysAhead: number;
    description: string;
  };

  const listingSpecs: ListingSpec[] = [
    {
      farmer: 'mehdi',
      category: 'cereals',
      variety: 'Blé dur Karim',
      qtx: 800,
      grade: 'grade_a',
      priceMad: 460,
      minOrder: 50,
      region: 'Fès-Meknès',
      status: 'active',
      harvestDaysAgo: 20,
      untilDaysAhead: 60,
      description: 'Blé dur de qualité supérieure, taux de protéines 13%, récolte 2026.',
    },
    {
      farmer: 'mehdi',
      category: 'legumes',
      variety: 'Lentilles vertes',
      qtx: 120,
      grade: 'premium',
      priceMad: 1200,
      minOrder: 10,
      region: 'Fès-Meknès',
      status: 'active',
      harvestDaysAgo: 35,
      untilDaysAhead: 90,
      description: 'Lentilles vertes du plateau de Meknès, calibre régulier.',
    },
    {
      farmer: 'aicha',
      category: 'olives',
      variety: 'Olive Picholine',
      qtx: 300,
      grade: 'grade_a',
      priceMad: 720,
      minOrder: 20,
      region: 'Marrakech-Safi',
      status: 'active',
      harvestDaysAgo: 10,
      untilDaysAhead: 40,
      description: 'Olives Picholine marocaine pour conserve et trituration.',
    },
    {
      farmer: 'aicha',
      category: 'olives',
      variety: 'Huile d’olive extra vierge',
      qtx: 80,
      grade: 'premium',
      priceMad: 6500,
      minOrder: 5,
      region: 'Marrakech-Safi',
      status: 'negotiating',
      harvestDaysAgo: 25,
      untilDaysAhead: 30,
      description: 'Huile extra vierge, acidité < 0,4%, première pression à froid.',
    },
    {
      farmer: 'brahim',
      category: 'dates',
      variety: 'Mejhoul premium',
      qtx: 150,
      grade: 'premium',
      priceMad: 8000,
      minOrder: 5,
      region: 'Drâa-Tafilalet',
      status: 'active',
      harvestDaysAgo: 45,
      untilDaysAhead: 120,
      description: 'Dattes Mejhoul calibre extra, certifiées bio (Ecocert).',
    },
    {
      farmer: 'brahim',
      category: 'dates',
      variety: 'Boufeggous',
      qtx: 200,
      grade: 'grade_a',
      priceMad: 3200,
      minOrder: 10,
      region: 'Drâa-Tafilalet',
      status: 'active',
      harvestDaysAgo: 45,
      untilDaysAhead: 120,
      description: 'Dattes Boufeggous, idéales pour transformation (pâte, sirop).',
    },
    {
      farmer: 'youssef',
      category: 'citrus',
      variety: 'Clémentine Nour',
      qtx: 1200,
      grade: 'grade_a',
      priceMad: 340,
      minOrder: 100,
      region: 'Souss-Massa',
      status: 'active',
      harvestDaysAgo: 5,
      untilDaysAhead: 35,
      description: 'Clémentines Nour, calibre export, sans pépins.',
    },
    {
      farmer: 'youssef',
      category: 'citrus',
      variety: 'Orange Maroc Late',
      qtx: 900,
      grade: 'grade_b',
      priceMad: 280,
      minOrder: 80,
      region: 'Souss-Massa',
      status: 'sold',
      harvestDaysAgo: 60,
      untilDaysAhead: 10,
      description: 'Oranges Maroc Late pour jus et marché local.',
    },
    {
      farmer: 'fatima',
      category: 'vegetables',
      variety: 'Tomate ronde',
      qtx: 600,
      grade: 'grade_a',
      priceMad: 420,
      minOrder: 50,
      region: 'Souss-Massa',
      status: 'active',
      harvestDaysAgo: 3,
      untilDaysAhead: 20,
      description: 'Tomates rondes sous serre, calibre 57-67 mm.',
    },
    {
      farmer: 'fatima',
      category: 'vegetables',
      variety: 'Poivron vert',
      qtx: 250,
      grade: 'standard',
      priceMad: 510,
      minOrder: 20,
      region: 'Souss-Massa',
      status: 'negotiating',
      harvestDaysAgo: 4,
      untilDaysAhead: 18,
      description: 'Poivrons verts frais, récolte quotidienne.',
    },
    {
      farmer: 'hassan',
      category: 'argan',
      variety: 'Huile d’argan alimentaire',
      qtx: 40,
      grade: 'premium',
      priceMad: 22000,
      minOrder: 2,
      region: 'Marrakech-Safi',
      status: 'active',
      harvestDaysAgo: 30,
      untilDaysAhead: 150,
      description: 'Huile d’argan alimentaire pressée à froid, coopérative féminine.',
    },
    {
      farmer: 'hassan',
      category: 'argan',
      variety: 'Amlou artisanal',
      qtx: 25,
      grade: 'grade_a',
      priceMad: 9000,
      minOrder: 1,
      region: 'Marrakech-Safi',
      status: 'active',
      harvestDaysAgo: 20,
      untilDaysAhead: 90,
      description: 'Amlou (argan + amandes + miel), préparation artisanale.',
    },
  ];

  const listingIdByVariety: Record<string, string> = {};

  for (const l of listingSpecs) {
    const id = createId();
    listingIdByVariety[l.variety] = id;
    await db.insert(listings).values({
      id,
      farmerId: farmerProfileIds[l.farmer] as string,
      productCategory: l.category,
      productVariety: l.variety,
      quantityQtx: l.qtx,
      qualityGrade: l.grade,
      askPricePerQtx: toMoney(l.priceMad),
      minOrderQtx: l.minOrder,
      harvestDate: l.harvestDaysAgo ? daysAgo(l.harvestDaysAgo) : null,
      availableUntil: daysAhead(l.untilDaysAhead),
      region: l.region,
      description: l.description,
      status: l.status,
      viewCount: Math.floor(Math.random() * 200),
      productVector: productEmbedding(l.category, l.variety),
      createdAt: daysAgo((l.harvestDaysAgo ?? 30) - 1),
    });
  }

  // -------------------------------------------------------------------------
  // RFQs (4)
  // -------------------------------------------------------------------------
  const rfqSpecs = [
    {
      buyer: 'atlas',
      category: 'cereals',
      variety: 'Blé dur',
      min: 200,
      max: 1000,
      maxPriceMad: 480,
      grade: 'grade_a',
      region: 'Fès-Meknès',
      neededInDays: 30,
      description: 'Recherche blé dur pour semoulerie, protéines ≥ 12,5%.',
    },
    {
      buyer: 'medexport',
      category: 'dates',
      variety: 'Mejhoul',
      min: 50,
      max: 150,
      maxPriceMad: 8500,
      grade: 'premium',
      region: 'Drâa-Tafilalet',
      neededInDays: 45,
      description: 'Dattes Mejhoul calibre export pour marché européen, bio exigé.',
    },
    {
      buyer: 'coopmeknes',
      category: 'olives',
      variety: 'Olive Picholine',
      min: 100,
      max: 400,
      maxPriceMad: 760,
      grade: 'grade_a',
      region: 'Marrakech-Safi',
      neededInDays: 25,
      description: 'Olives pour trituration, livraison échelonnée.',
    },
    {
      buyer: 'riad',
      category: 'vegetables',
      variety: 'Tomate',
      min: 50,
      max: 200,
      maxPriceMad: 460,
      grade: 'grade_a',
      region: 'Souss-Massa',
      neededInDays: 14,
      description: 'Approvisionnement hôtelier en tomates fraîches, hebdomadaire.',
    },
  ];

  for (const r of rfqSpecs) {
    await db.insert(rfqs).values({
      id: createId(),
      buyerId: buyerProfileIds[r.buyer] as string,
      productCategory: r.category,
      productVariety: r.variety,
      quantityQtxMin: r.min,
      quantityQtxMax: r.max,
      maxPricePerQtx: toMoney(r.maxPriceMad),
      requiredQualityGrade: r.grade,
      requiredCertifications: r.category === 'dates' ? ['organic'] : [],
      deliveryRegion: r.region,
      neededBy: daysAhead(r.neededInDays),
      description: r.description,
      status: 'open',
      productVector: productEmbedding(r.category, r.variety),
      createdAt: daysAgo(7),
    });
  }

  // -------------------------------------------------------------------------
  // Deals (6) + escrows + logistics + reviews
  // -------------------------------------------------------------------------
  type DealSpec = {
    farmer: string;
    buyer: string;
    listingVariety: string;
    category: string;
    variety: string;
    qtx: number;
    priceMad: number;
    region: string;
    status: 'negotiating' | 'in_transit' | 'completed';
    originRegion: string;
    truckType: 'standard' | 'refrigerated' | 'bulk';
    provider?: string;
    farmerReview?: { rating: number; comment: string };
    buyerReview?: { rating: number; comment: string };
  };

  const dealSpecs: DealSpec[] = [
    // 2 completed (reviews + released escrow)
    {
      farmer: 'mehdi',
      buyer: 'atlas',
      listingVariety: 'Blé dur Karim',
      category: 'cereals',
      variety: 'Blé dur Karim',
      qtx: 400,
      priceMad: 455,
      region: 'Casablanca-Settat',
      status: 'completed',
      originRegion: 'Fès-Meknès',
      truckType: 'bulk',
      provider: 'transatlas',
      farmerReview: { rating: 5, comment: 'Paiement rapide, acheteur sérieux.' },
      buyerReview: { rating: 5, comment: 'Blé conforme, excellente qualité.' },
    },
    {
      farmer: 'brahim',
      buyer: 'medexport',
      listingVariety: 'Mejhoul premium',
      category: 'dates',
      variety: 'Mejhoul premium',
      qtx: 80,
      priceMad: 7900,
      region: 'Tanger-Tétouan-Al Hoceïma',
      status: 'completed',
      originRegion: 'Drâa-Tafilalet',
      truckType: 'refrigerated',
      provider: 'coldsud',
      farmerReview: { rating: 5, comment: 'Exportateur professionnel, je recommande.' },
      buyerReview: { rating: 5, comment: 'Dattes calibre extra, emballage parfait.' },
    },
    // 2 in_transit (escrow fully funded)
    {
      farmer: 'aicha',
      buyer: 'coopmeknes',
      listingVariety: 'Olive Picholine',
      category: 'olives',
      variety: 'Olive Picholine',
      qtx: 200,
      priceMad: 710,
      region: 'Fès-Meknès',
      status: 'in_transit',
      originRegion: 'Marrakech-Safi',
      truckType: 'standard',
      provider: 'transatlas',
    },
    {
      farmer: 'youssef',
      buyer: 'riad',
      listingVariety: 'Clémentine Nour',
      category: 'citrus',
      variety: 'Clémentine Nour',
      qtx: 150,
      priceMad: 335,
      region: 'Rabat-Salé-Kénitra',
      status: 'in_transit',
      originRegion: 'Souss-Massa',
      truckType: 'refrigerated',
      provider: 'coldsud',
    },
    // 2 negotiating (no escrow yet)
    {
      farmer: 'fatima',
      buyer: 'atlas',
      listingVariety: 'Tomate ronde',
      category: 'vegetables',
      variety: 'Tomate ronde',
      qtx: 120,
      priceMad: 415,
      region: 'Casablanca-Settat',
      status: 'negotiating',
      originRegion: 'Souss-Massa',
      truckType: 'refrigerated',
    },
    {
      farmer: 'hassan',
      buyer: 'medexport',
      listingVariety: 'Huile d’argan alimentaire',
      category: 'argan',
      variety: 'Huile d’argan alimentaire',
      qtx: 10,
      priceMad: 21500,
      region: 'Tanger-Tétouan-Al Hoceïma',
      status: 'negotiating',
      originRegion: 'Marrakech-Safi',
      truckType: 'standard',
    },
  ];

  for (const d of dealSpecs) {
    const dealId = createId();
    const agreedPrice = toMoney(d.priceMad);
    const totalAmount = agreedPrice * d.qtx;
    const dealStatus =
      d.status === 'completed'
        ? 'completed'
        : d.status === 'in_transit'
          ? 'in_transit'
          : 'negotiating';

    await db.insert(deals).values({
      id: dealId,
      listingId: listingIdByVariety[d.listingVariety] ?? null,
      farmerId: farmerProfileIds[d.farmer] as string,
      buyerId: buyerProfileIds[d.buyer] as string,
      productCategory: d.category,
      productVariety: d.variety,
      quantityQtx: d.qtx,
      agreedPricePerQtx: agreedPrice,
      totalAmount,
      deliveryRegion: d.region,
      deliveryDate: d.status === 'negotiating' ? daysAhead(21) : daysAhead(7),
      status: dealStatus,
      contractKey: d.status === 'negotiating' ? null : `contracts/${dealId}.pdf`,
      createdAt: daysAgo(d.status === 'completed' ? 40 : d.status === 'in_transit' ? 12 : 3),
    });

    // Escrow for funded deals (in_transit = fully_funded, completed = released).
    if (d.status !== 'negotiating') {
      const { deposit, remainder } = computeEscrowSplit(totalAmount);
      const fees = computeFees(totalAmount);
      const released = d.status === 'completed';
      await db.insert(escrows).values({
        id: createId(),
        dealId,
        buyerId: buyerProfileIds[d.buyer] as string,
        farmerId: farmerProfileIds[d.farmer] as string,
        grossAmount: totalAmount,
        deposit,
        remainder,
        platformFeeFromBuyer: fees.buyerFee,
        platformFeeFromFarmer: fees.farmerFee,
        farmerPayout: fees.farmerPayout,
        status: released ? 'released' : 'fully_funded',
        depositPaidAt: daysAgo(released ? 38 : 11),
        fullyFundedAt: daysAgo(released ? 30 : 6),
        releasedAt: released ? daysAgo(20) : null,
        createdAt: daysAgo(released ? 38 : 11),
      });

      // Logistics request (+ accepted quote) for funded deals.
      const reqId = createId();
      await db.insert(logisticsRequests).values({
        id: reqId,
        dealId,
        originRegion: d.originRegion,
        destinationRegion: d.region,
        productCategory: d.category,
        weightTonnes: d.qtx / 10, // 1 quintal = 0.1 tonne
        truckType: d.truckType,
        pickupDate: daysAgo(released ? 28 : 5),
        urgent: d.truckType === 'refrigerated',
        status: released ? 'delivered' : 'in_transit',
        assignedProviderId: d.provider ? logiProfileIds[d.provider] : null,
        agreedPrice: toMoney(d.qtx * 6), // ~6 MAD/qtx transport
        createdAt: daysAgo(released ? 30 : 6),
      });

      if (d.provider) {
        await db.insert(logisticsQuotes).values({
          id: createId(),
          requestId: reqId,
          providerId: logiProfileIds[d.provider] as string,
          priceQuoted: toMoney(d.qtx * 6),
          availableFrom: daysAgo(released ? 29 : 5),
          message: 'Disponible, camion conforme.',
          accepted: true,
          createdAt: daysAgo(released ? 30 : 6),
        });
      }
    }

    // Reviews for completed deals (mutual).
    if (d.status === 'completed' && d.farmerReview && d.buyerReview) {
      // Buyer reviews farmer.
      await db.insert(reviews).values({
        id: createId(),
        dealId,
        reviewerId: buyerUserIds[d.buyer] as string,
        revieweeId: farmerUserIds[d.farmer] as string,
        rating: d.buyerReview.rating,
        comment: d.buyerReview.comment,
        reviewerRole: 'buyer',
        createdAt: daysAgo(19),
      });
      // Farmer reviews buyer.
      await db.insert(reviews).values({
        id: createId(),
        dealId,
        reviewerId: farmerUserIds[d.farmer] as string,
        revieweeId: buyerUserIds[d.buyer] as string,
        rating: d.farmerReview.rating,
        comment: d.farmerReview.comment,
        reviewerRole: 'farmer',
        createdAt: daysAgo(19),
      });
    }
  }

  // -------------------------------------------------------------------------
  // Price board — 6 months of monthly points for the top 5 products.
  // -------------------------------------------------------------------------
  type PriceSeries = {
    category: string;
    variety: string;
    region: string;
    baseMad: number;
    monthlyDriftMad: number;
  };

  const priceSeries: PriceSeries[] = [
    {
      category: 'cereals',
      variety: 'Blé dur',
      region: 'Fès-Meknès',
      baseMad: 430,
      monthlyDriftMad: 8,
    },
    {
      category: 'olives',
      variety: 'Olive Picholine',
      region: 'Marrakech-Safi',
      baseMad: 680,
      monthlyDriftMad: 12,
    },
    {
      category: 'dates',
      variety: 'Mejhoul',
      region: 'Drâa-Tafilalet',
      baseMad: 7600,
      monthlyDriftMad: 90,
    },
    {
      category: 'citrus',
      variety: 'Clémentine',
      region: 'Souss-Massa',
      baseMad: 310,
      monthlyDriftMad: 7,
    },
    {
      category: 'vegetables',
      variety: 'Tomate',
      region: 'Souss-Massa',
      baseMad: 390,
      monthlyDriftMad: 10,
    },
  ];

  for (const s of priceSeries) {
    for (let m = 5; m >= 0; m--) {
      // Older months cheaper; small deterministic wobble.
      const wobble = ((m * 37) % 11) - 5;
      const mad = s.baseMad + (5 - m) * s.monthlyDriftMad + wobble;
      await db.insert(pricePoints).values({
        id: createId(),
        productCategory: s.category,
        productVariety: s.variety,
        region: s.region,
        pricePerQtx: toMoney(mad),
        source: m === 0 ? 'mawsim_transaction' : 'onicl',
        recordedAt: daysAgo(m * 30 + 2),
      });
    }
  }

  // -------------------------------------------------------------------------
  // Price alerts (demo)
  // -------------------------------------------------------------------------
  await db.insert(priceAlerts).values([
    {
      id: createId(),
      userId: farmerUserIds['mehdi'] as string,
      productCategory: 'cereals',
      productVariety: 'Blé dur',
      region: 'Fès-Meknès',
      thresholdPricePerQtx: toMoney(480),
      direction: 'above',
      active: true,
    },
    {
      id: createId(),
      userId: buyerUserIds['atlas'] as string,
      productCategory: 'cereals',
      productVariety: 'Blé dur',
      region: 'Fès-Meknès',
      thresholdPricePerQtx: toMoney(440),
      direction: 'below',
      active: true,
    },
  ]);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('✅ Seed complete:');
  console.log(
    `   ${farmerSpecs.length} farmers · ${buyerSpecs.length} buyers · ${logiSpecs.length} logistics`
  );
  console.log(
    `   ${listingSpecs.length} listings · ${rfqSpecs.length} RFQs · ${dealSpecs.length} deals`
  );
  console.log(`   ${priceSeries.length * 6} price points · 2 price alerts`);
  console.log('   Demo: mehdi.fellah@demo.mawsim.ma / atlas.food@demo.mawsim.ma (demo1234)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
