-- ============================================================
-- Mawsim — RLS, app role, policies, pgvector HNSW indexes
-- S0-05/S0-06: applied after table creation (0000_init_tables)
-- ============================================================

-- ============================================================
-- App role for RLS (application connects as this role)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mawsim_app') THEN
    CREATE ROLE mawsim_app LOGIN PASSWORD 'mawsim_app_password';
  END IF;
END $$;
--> statement-breakpoint

GRANT CONNECT ON DATABASE mawsim TO mawsim_app;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO mawsim_app;--> statement-breakpoint
GRANT ALL ON ALL TABLES IN SCHEMA public TO mawsim_app;--> statement-breakpoint
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO mawsim_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mawsim_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mawsim_app;--> statement-breakpoint

-- ============================================================
-- Enable RLS on sensitive tables
-- ============================================================
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE logistics_profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE farmer_certifications ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE logistics_requests ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE logistics_quotes ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ============================================================
-- RLS Policies
-- Set via: SET LOCAL app.current_user_id = '...';
--          SET LOCAL app.current_user_role = '...';
-- ============================================================

-- farmer_profiles: farmer sees own, admin sees all
CREATE POLICY farmer_profiles_select ON farmer_profiles
  FOR SELECT USING (
    current_setting('app.current_user_role', true) = 'admin'
    OR user_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

CREATE POLICY farmer_profiles_update ON farmer_profiles
  FOR UPDATE USING (
    current_setting('app.current_user_role', true) = 'admin'
    OR user_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

CREATE POLICY farmer_profiles_insert ON farmer_profiles
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

-- buyer_profiles: buyer sees own, admin sees all
CREATE POLICY buyer_profiles_select ON buyer_profiles
  FOR SELECT USING (
    current_setting('app.current_user_role', true) = 'admin'
    OR user_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

CREATE POLICY buyer_profiles_update ON buyer_profiles
  FOR UPDATE USING (
    current_setting('app.current_user_role', true) = 'admin'
    OR user_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

CREATE POLICY buyer_profiles_insert ON buyer_profiles
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

-- farmer_certifications: farmer sees own certs, admin sees all
-- Document keys (R2 private) are in this table — strict access
CREATE POLICY farmer_certifications_select ON farmer_certifications
  FOR SELECT USING (
    current_setting('app.current_user_role', true) = 'admin'
    OR farmer_id IN (
      SELECT id FROM farmer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );--> statement-breakpoint

CREATE POLICY farmer_certifications_insert ON farmer_certifications
  FOR INSERT WITH CHECK (
    farmer_id IN (
      SELECT id FROM farmer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );--> statement-breakpoint

-- listings: public read for active listings; farmer manages own
CREATE POLICY listings_select ON listings
  FOR SELECT USING (
    status = 'active'
    OR current_setting('app.current_user_role', true) = 'admin'
    OR farmer_id IN (
      SELECT id FROM farmer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );--> statement-breakpoint

CREATE POLICY listings_insert ON listings
  FOR INSERT WITH CHECK (
    farmer_id IN (
      SELECT id FROM farmer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint

CREATE POLICY listings_update ON listings
  FOR UPDATE USING (
    current_setting('app.current_user_role', true) = 'admin'
    OR farmer_id IN (
      SELECT id FROM farmer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );--> statement-breakpoint

-- rfqs: buyer sees own, farmers/admin see open rfqs
CREATE POLICY rfqs_select ON rfqs
  FOR SELECT USING (
    current_setting('app.current_user_role', true) IN ('admin', 'farmer')
    OR buyer_id IN (
      SELECT id FROM buyer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );--> statement-breakpoint

CREATE POLICY rfqs_insert ON rfqs
  FOR INSERT WITH CHECK (
    buyer_id IN (
      SELECT id FROM buyer_profiles
      WHERE user_id = current_setting('app.current_user_id', true)
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint

-- deals: farmer and buyer in the deal see it; admin sees all
CREATE POLICY deals_select ON deals
  FOR SELECT USING (
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

-- escrows: farmer + buyer in deal see it; admin sees all
CREATE POLICY escrows_select ON escrows
  FOR SELECT USING (
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

-- notifications: user sees own only
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint

-- price_alerts: user sees own only
CREATE POLICY price_alerts_select ON price_alerts
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint

CREATE POLICY price_alerts_insert ON price_alerts
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
  );--> statement-breakpoint

-- audit_logs: admin-only read; insert via trigger/app only
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT USING (
    current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint

-- ============================================================
-- price_points: public read (price board is public — ADR-03)
-- No RLS on price_points — it's public data
-- ============================================================

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_listings_status_category ON listings(status, product_category);--> statement-breakpoint
CREATE INDEX idx_listings_region ON listings(region);--> statement-breakpoint
CREATE INDEX idx_listings_farmer ON listings(farmer_id);--> statement-breakpoint
CREATE INDEX idx_rfqs_status ON rfqs(status);--> statement-breakpoint
CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_id);--> statement-breakpoint
CREATE INDEX idx_deals_farmer ON deals(farmer_id);--> statement-breakpoint
CREATE INDEX idx_deals_buyer ON deals(buyer_id);--> statement-breakpoint
CREATE INDEX idx_deals_status ON deals(status);--> statement-breakpoint
CREATE INDEX idx_price_points_category_region ON price_points(product_category, region);--> statement-breakpoint
CREATE INDEX idx_price_points_recorded_at ON price_points(recorded_at DESC);--> statement-breakpoint
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);--> statement-breakpoint
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);--> statement-breakpoint
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);--> statement-breakpoint

-- pgvector HNSW indexes for fast similarity search
CREATE INDEX idx_listings_vector ON listings USING hnsw (product_vector vector_cosine_ops);--> statement-breakpoint
CREATE INDEX idx_rfqs_vector ON rfqs USING hnsw (product_vector vector_cosine_ops);
