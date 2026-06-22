import PgBoss from 'pg-boss';
import { QUEUES } from './queues';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const boss = new PgBoss({
  connectionString: DATABASE_URL,
  deleteAfterDays: 7,
  retentionDays: 30,
  monitorStateIntervalSeconds: 30,
});

boss.on('error', (err) => console.error('[pg-boss]', err));

// Queue names live in ./queues (side-effect free) so producers can import them
// without starting this worker. Re-exported here for backwards compatibility.
export { QUEUES, type QueueName } from './queues';

// ── Handlers ───────────────────────────────────────────────────

// pg-boss v10: WorkHandler receives a batch (Job<T>[]), not a single Job.
type Jobs = PgBoss.Job<Record<string, unknown>>[];

async function handlePriceAlerts(jobs: Jobs) {
  for (const job of jobs) {
    console.log('[worker] price.alerts tick', job.id);
    // S5: checkPriceAlerts() lives in @mawsim/pricing; called from the web app
    // on-demand. Worker stub logs here; S6 wires in-app + email notifications.
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

async function handleListingEmbed(jobs: Jobs) {
  for (const job of jobs) {
    console.log('[worker] listing.embed', job.data);
    // The product vector is written synchronously on publish (see
    // apps/web/src/server/listing.ts). This async hook is reserved for future
    // re-embedding on edits and bulk back-fills. No-op for v0.1.
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
  await boss.work(QUEUES.LISTING_EMBED, handleListingEmbed);

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
