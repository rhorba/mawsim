-- ============================================================
-- Mawsim — S3: deal + offer RLS write policies (negotiation engine)
-- ============================================================
-- Sprint 3 introduces the first writes to `deals` and `offers`. Both tables had
-- RLS ENABLED in 0001 but `deals` carried only a SELECT policy and `offers` had
-- none at all. With RLS enabled and no matching policy, every INSERT/UPDATE by
-- the application role (mawsim_app — non-owner, RLS-enforced) is DENIED. This
-- migration adds the write policies the offer/negotiation flow requires, keeping
-- visibility scoped to the two parties of a deal (+ admin), consistent with the
-- existing deals_select policy.

-- ============================================================
-- deals: a party (farmer or buyer) may create + mutate their own deal
-- ============================================================
CREATE POLICY deals_insert ON deals
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

CREATE POLICY deals_update ON deals
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
  );--> statement-breakpoint

-- ============================================================
-- offers: visible to / writable by parties of the parent deal.
-- `deal_id IN (SELECT id FROM deals)` leverages deals_select RLS — the subquery
-- only returns deals the caller can already see (parties + admin), so offer
-- visibility tracks deal visibility with no duplicated party logic.
-- INSERT additionally pins author_user_id to the caller (no spoofing authorship).
-- ============================================================
CREATE POLICY offers_select ON offers
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals)
  );--> statement-breakpoint

CREATE POLICY offers_insert ON offers
  FOR INSERT WITH CHECK (
    author_user_id = current_setting('app.current_user_id', true)
    AND deal_id IN (SELECT id FROM deals)
  );--> statement-breakpoint

-- Offers are immutable once written (append-only negotiation history); no
-- UPDATE/DELETE policy is intentional.

CREATE INDEX idx_offers_deal ON offers(deal_id, created_at);
