'use server';

import { withRole } from '@/lib/action';
import { withUserContext } from '@mawsim/db';
import { buyerProfiles, deals, farmerProfiles, notifications, reviews } from '@mawsim/db/schema';
import { ReviewError, validateComment, validateRating } from '@mawsim/marketplace';
import { and, avg, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { DealRecord } from './deal-types';

const PostReviewSchema = z.object({
  dealId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type ReviewRecord = typeof reviews.$inferSelect;

export const postReview = withRole(['farmer', 'buyer'], async (session, raw: unknown) => {
  const input = PostReviewSchema.parse(raw);
  validateRating(input.rating);
  validateComment(input.comment);

  return withUserContext(session.userId, session.role, async (tx) => {
    const [deal] = await tx.select().from(deals).where(eq(deals.id, input.dealId)).limit(1);
    if (!deal) throw new ReviewError('Transaction introuvable.');
    const d = deal as DealRecord;

    if (d.status !== 'completed') {
      throw new ReviewError('L’évaluation n’est disponible qu’une fois la transaction complétée.');
    }

    // Resolve this user's profile id + role within the deal.
    let reviewerId: string;
    let revieweeId: string;
    let reviewerRole: 'farmer' | 'buyer';

    if (session.role === 'farmer') {
      const [fp] = await tx
        .select({ id: farmerProfiles.id, userId: farmerProfiles.userId })
        .from(farmerProfiles)
        .where(eq(farmerProfiles.userId, session.userId))
        .limit(1);
      if (!fp || d.farmerId !== fp.id) throw new ReviewError('Transaction introuvable.');
      reviewerId = session.userId;
      revieweeId = d.buyerId;
      reviewerRole = 'farmer';
    } else {
      const [bp] = await tx
        .select({ id: buyerProfiles.id, userId: buyerProfiles.userId })
        .from(buyerProfiles)
        .where(eq(buyerProfiles.userId, session.userId))
        .limit(1);
      if (!bp || d.buyerId !== bp.id) throw new ReviewError('Transaction introuvable.');
      reviewerId = session.userId;
      revieweeId = d.farmerId;
      reviewerRole = 'buyer';
    }

    // Idempotency: one review per reviewer per deal.
    const [existing] = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.dealId, input.dealId), eq(reviews.reviewerId, reviewerId)))
      .limit(1);
    if (existing) throw new ReviewError('Vous avez déjà évalué cette transaction.');

    const [review] = await tx
      .insert(reviews)
      .values({
        dealId: input.dealId,
        reviewerId,
        revieweeId,
        rating: input.rating,
        comment: input.comment ?? null,
        reviewerRole,
      })
      .returning();

    // Update reviewee's avg_rating + review_count on their profile.
    if (reviewerRole === 'farmer') {
      // Farmer reviewed buyer → update buyer profile stats.
      const [stats] = await tx
        .select({
          avgRating: avg(reviews.rating),
          total: count(reviews.id),
        })
        .from(reviews)
        .where(eq(reviews.revieweeId, revieweeId));

      await tx
        .update(buyerProfiles)
        .set({
          avgRating: String(Number(stats?.avgRating ?? 0).toFixed(2)),
          reviewCount: stats?.total ?? 0,
        })
        .where(eq(buyerProfiles.id, revieweeId));
    } else {
      // Buyer reviewed farmer → update farmer profile stats.
      const [stats] = await tx
        .select({
          avgRating: avg(reviews.rating),
          total: count(reviews.id),
        })
        .from(reviews)
        .where(eq(reviews.revieweeId, revieweeId));

      await tx
        .update(farmerProfiles)
        .set({
          avgRating: String(Number(stats?.avgRating ?? 0).toFixed(2)),
          reviewCount: stats?.total ?? 0,
        })
        .where(eq(farmerProfiles.id, revieweeId));
    }

    // Notify the reviewee (fire-and-forget — don't block on failure).
    tx.insert(notifications)
      .values({
        userId: revieweeId,
        event: 'delivery_confirmed',
        entityId: input.dealId,
        data: { reviewerRole, rating: input.rating },
      })
      .catch((err) => console.error('[postReview] notification insert failed', err));

    return review as ReviewRecord;
  });
});

export const getDealReviews = withRole(
  ['farmer', 'buyer', 'admin'],
  async (_session, dealId: string) => {
    const rows = await withUserContext(_session.userId, _session.role, async (tx) => {
      return tx.select().from(reviews).where(eq(reviews.dealId, dealId));
    });
    return rows as ReviewRecord[];
  }
);

/** Whether the current user has already reviewed this deal. */
export const hasReviewedDeal = withRole(['farmer', 'buyer'], async (session, dealId: string) => {
  const rows = await withUserContext(session.userId, session.role, async (tx) => {
    return tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.dealId, dealId), eq(reviews.reviewerId, session.userId)))
      .limit(1);
  });
  return rows.length > 0;
});
