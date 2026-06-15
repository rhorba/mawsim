-- ============================================================
-- Mawsim — S2: public read of farmer PUBLIC profile fields (via view)
-- ============================================================
-- The marketplace is public: active listings + RFQ match results must show the
-- producer's farm name, region, and rating (CLAUDE.md UX §2, S2-04). But the
-- farmer_profiles row also holds `bank_details_encrypted`, and RLS is row-level
-- — a permissive row policy would expose the bank column too (and breaks the
-- Sprint-1 RLS isolation tests, which is correct).
--
-- Solution: a VIEW exposing ONLY safe columns (never bank details). Postgres
-- views run with the definer's privileges by default, so the view bypasses
-- farmer_profiles RLS while structurally guaranteeing the bank column can never
-- be selected through it. Table RLS is unchanged → isolation invariants hold.
-- An earlier iteration of this migration created a permissive row policy; drop
-- it if a dev DB already applied that version.
DROP POLICY IF EXISTS farmer_profiles_public_select ON farmer_profiles;--> statement-breakpoint

CREATE OR REPLACE VIEW farmer_public_profiles AS
  SELECT
    id,
    farm_name,
    region,
    commune,
    avg_rating,
    review_count,
    completed_deals
  FROM farmer_profiles;--> statement-breakpoint

GRANT SELECT ON farmer_public_profiles TO mawsim_app;
