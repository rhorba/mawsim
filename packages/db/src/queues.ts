// Queue name constants — side-effect free so producers (web app server actions)
// can import them WITHOUT pulling in worker.ts, which starts pg-boss on import.
export const QUEUES = {
  PRICE_ALERTS: 'price.alerts',
  DEAL_EXPIRY: 'deal.expiry',
  ESCROW_SWEEP: 'escrow.sweep',
  LOGISTICS_SWEEP: 'logistics.sweep',
  AUCTION_CLOSE: 'auction.close',
  // Sprint 2: refresh a listing's product embedding after publish/edit.
  LISTING_EMBED: 'listing.embed',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
