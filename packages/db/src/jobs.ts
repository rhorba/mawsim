import PgBoss from 'pg-boss';
import { QUEUES } from './queues';

// Producer-side pg-boss client, separate from worker.ts (which is its own
// long-running process). Lazily started once per process and reused.
let bossPromise: Promise<PgBoss> | null = null;

async function getBoss(): Promise<PgBoss> {
  if (!bossPromise) {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL is required');
    const boss = new PgBoss({ connectionString: url });
    boss.on('error', (err) => console.error('[pg-boss producer]', err));
    bossPromise = boss.start().then(async () => {
      // Ensure the queue exists before any send (pg-boss v10 requires this).
      // The worker also creates it via work(); createQueue is safe to repeat.
      try {
        await boss.createQueue(QUEUES.LISTING_EMBED);
      } catch {
        /* already exists — fine */
      }
      return boss;
    });
  }
  return bossPromise;
}

/**
 * Enqueue a product-embedding refresh for a listing. Best-effort: a failure to
 * reach the queue must never block the publish flow, since the listing's vector
 * is also written synchronously at publish time. The job is the async hook for
 * future re-embedding (description edits, bulk back-fills).
 */
export async function enqueueListingEmbed(listingId: string): Promise<void> {
  try {
    const boss = await getBoss();
    await boss.send(QUEUES.LISTING_EMBED, { listingId });
  } catch (err) {
    console.error('[enqueueListingEmbed] non-fatal', err);
  }
}
