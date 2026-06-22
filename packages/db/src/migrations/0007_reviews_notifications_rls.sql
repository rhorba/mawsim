-- ============================================================
-- Mawsim — S6: reviews + notifications RLS write policies
-- ============================================================
-- reviews: RLS was enabled in 0001 but no policies were added (read-only
--   for now — Sprint 6 activates them). Add SELECT (own) + INSERT (own).
-- notifications: SELECT policy exists (0001). Add INSERT + UPDATE (mark-read).
-- farmer_certifications: add UPDATE for admin to approve/reject.
-- ============================================================

-- reviews: parties of the reviewed deal can see reviews; reviewer inserts own
CREATE POLICY reviews_select ON reviews
  FOR SELECT USING (
    current_setting('app.current_user_role', true) = 'admin'
    OR reviewer_id = current_setting('app.current_user_id', true)
    OR reviewee_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

CREATE POLICY reviews_insert ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

-- notifications: authenticated user inserts own; marks own read
CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) = 'admin'
  ) WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint

-- farmer_certifications: admin can update verified + admin_note
CREATE POLICY farmer_certifications_update ON farmer_certifications
  FOR UPDATE USING (
    current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint

-- Index for notification reads
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reviews_deal ON reviews(deal_id);
