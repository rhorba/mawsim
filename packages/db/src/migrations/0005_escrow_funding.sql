-- ============================================================
-- Mawsim — S4: escrow funding + dual delivery confirmation
-- ============================================================
-- Sprint 4 introduces the first writes to `escrows` and adds dual delivery
-- confirmation to `deals`. Two changes:
--   1. deals gains two nullable confirmation timestamps (one per party). The
--      escrow remainder (70%) is released only once BOTH are set.
--   2. escrows had RLS ENABLED + a SELECT policy (0001) but no write policies,
--      so INSERT/UPDATE by the RLS-enforced app role (mawsim_app) was DENIED.
--      Add INSERT/UPDATE scoped to the two parties of the parent deal (+ admin),
--      mirroring deals_insert/deals_update from 0004.

-- ============================================================
-- deals: dual delivery confirmation timestamps
-- ============================================================
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS farmer_confirmed_delivery_at timestamptz;--> statement-breakpoint
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS buyer_confirmed_delivery_at timestamptz;--> statement-breakpoint

-- ============================================================
-- escrows: a party (farmer or buyer) of the deal may create + mutate its escrow
-- ============================================================
CREATE POLICY escrows_insert ON escrows
  FOR INSERT WITH CHECK (
    current_setting('app.current_user_role', true) = 'admin'
    OR farmer_id IN (
      SELECT id FROM farmer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
    OR buyer_id IN (
      SELECT id FROM buyer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );--> statement-breakpoint

CREATE POLICY escrows_update ON escrows
  FOR UPDATE USING (
    current_setting('app.current_user_role', true) = 'admin'
    OR farmer_id IN (
      SELECT id FROM farmer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
    OR buyer_id IN (
      SELECT id FROM buyer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  ) WITH CHECK (
    current_setting('app.current_user_role', true) = 'admin'
    OR farmer_id IN (
      SELECT id FROM farmer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
    OR buyer_id IN (
      SELECT id FROM buyer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );
