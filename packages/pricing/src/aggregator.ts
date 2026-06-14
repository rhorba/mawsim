// Price board aggregation — Sprint 5
// Sources: mawsim_transaction (anonymized), onicl (manual), admin_manual

export interface PriceSummary {
  productCategory: string;
  productVariety?: string;
  region: string;
  avgPricePerQtx: number; // centimes
  minPricePerQtx: number;
  maxPricePerQtx: number;
  dataPoints: number;
  lastUpdated: Date;
}

export async function getMarketPrices(_params: {
  productCategory?: string;
  region?: string;
  days?: number;
}): Promise<PriceSummary[]> {
  throw new Error('Price aggregation not yet implemented — Sprint 5');
}
