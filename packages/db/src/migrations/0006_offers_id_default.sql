-- Mawsim — S5-fix: add DB-level DEFAULT to offers.id
--
-- Drizzle's $defaultFn is JS-only: it generates the UUID before the INSERT and
-- passes it as a parameter. That works for app code but breaks raw SQL inserts
-- (RLS tests, seed helpers) that omit the id column — Postgres has no default to
-- fall back on, so id arrives as NULL and violates NOT NULL.
--
-- gen_random_uuid() is built-in since PG13 (no extension needed).
ALTER TABLE offers ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
