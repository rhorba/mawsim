import PgBoss from 'pg-boss';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const boss = new PgBoss({
  connectionString: DATABASE_URL,
  deleteAfterDays: 7,
  retentionDays: 30,
  monitorStateIntervalSeconds: 30,
});

boss.on('error', (err) => console.error('[pg-boss]', err));

// ── Queue names ────────────────────────────────────────────────
export const QUEUES = {
  PRICE_ALERTS: 'price.alerts',
  DEAL_EXPIRY: 'deal.expiry',
  ESCROW_SWEEP: 'escrow.sweep',
  LOGISTICS_SWEEP: 'logistics.sweep',
  AUCTION_CLOSE: 'auction.close',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

// ── Handlers ───────────────────────────────────────────────────

// pg-boss v10: WorkHandler receives a batch (Job<T>[]), not a single Job.
type Jobs = PgBoss.Job<Record<string, unknown>>[];

async function handlePriceAlerts(jobs: Jobs) {
  for (const job of jobs) {
    console.log('[worker] price.alerts tick', job.id);
    // Sprint 5: check price_alerts table against latest price_points
  }
}

async function handleDealExpiry(jobs: Jobs) {
  for (const job of jobs) {
    console.log('[worker] deal.expiry', job.data);
    // Sprint 3: mark deals as cancelled if past deadline with no agreement
  }
}

async function handleEscrowSweep(jobs: Jobs) {
  for (const job of jobs) {
    console.log('[worker] escrow.sweep tick', job.id);
    // Sprint 4: flag escrows stuck in deposit_paid for >7 days
  }
}

async function handleLogisticsSweep(jobs: Jobs) {
  for (const job of jobs) {
    console.log('[worker] logistics.sweep tick', job.id);
    // Sprint 5: re-broadcast open logistics requests with no quotes after 24h
  }
}

async function handleAuctionClose(jobs: Jobs) {
  for (const job of jobs) {
    console.log('[worker] auction.close', job.data);
    // Sprint 3: finalize auction and move deal to agreed state
  }
}

// ── Startup ────────────────────────────────────────────────────

async function start() {
  await boss.start();
  console.log('[worker] pg-boss started');

  // Recurring cron jobs
  await boss.schedule(QUEUES.PRICE_ALERTS, '*/5 * * * *', {}); // every 5 min
  await boss.schedule(QUEUES.ESCROW_SWEEP, '0 * * * *', {}); // hourly
  await boss.schedule(QUEUES.LOGISTICS_SWEEP, '*/30 * * * *', {}); // every 30 min

  // Register handlers
  await boss.work(QUEUES.PRICE_ALERTS, handlePriceAlerts);
  await boss.work(QUEUES.DEAL_EXPIRY, handleDealExpiry);
  await boss.work(QUEUES.ESCROW_SWEEP, handleEscrowSweep);
  await boss.work(QUEUES.LOGISTICS_SWEEP, handleLogisticsSweep);
  await boss.work(QUEUES.AUCTION_CLOSE, handleAuctionClose);

  console.log('[worker] all queues registered:', Object.values(QUEUES).join(', '));
}

start().catch((err) => {
  console.error('[worker] fatal', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[worker] SIGTERM — stopping pg-boss');
  await boss.stop({ graceful: true, timeout: 10000 });
  process.exit(0);
});

export { boss };
