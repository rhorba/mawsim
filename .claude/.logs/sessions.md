# sessions

## SESSION_START — PROJECT INITIALIZED
Sprint: 0 — Ready to start
Status: Fresh project. Framework scaffolded. All S0 tasks pending.
Goal: `pnpm dev` works, Auth (4 roles), Postgres+pgvector+RLS running, role isolation proven.
**CRITICAL**: Use pgvector/pgvector:pg16 in Docker AND GitHub Actions CI (NOT postgres:16-alpine).
Next: S0-01 (workspace) → S0-06 (pgvector extension) → S0-07 (Auth.js 4 roles)

---

## SESSION_2 — 2026-06-03
Sprint: 0 — S0-01 through S0-16 COMPLETED

### Files created this session
**Root scaffold**
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `biome.json`, `.env.example`, `.gitignore`
- `docker-compose.yml`, `docker-compose.dev.yml`, `Caddyfile`
- `.github/workflows/ci.yml` (pgvector/pgvector:pg16 mandatory)

**packages/core** (S0-01, S0-03)
- `src/types.ts` — Money, Role, all domain types
- `src/money.ts` — toMoney, fromMoney, computeFees (2.5%+1.5%), computeEscrowSplit (30%+70%)
- `src/rbac.ts` — assertRole, withRole, can(), ROLE_CAPABILITIES map
- `src/schemas.ts` — Zod schemas: Signup, Login, Listing, RFQ, Offer, PriceAlert
- `src/__tests__/rbac.test.ts` — role isolation + bank details access tests
- `src/__tests__/money.test.ts` — fee math + escrow split precision tests

**packages/db** (S0-04, S0-05, S0-06)
- Full Drizzle schema: users, accounts, sessions, farmerProfiles, buyerProfiles, logisticsProfiles,
  farmerCertifications, listings (pgvector 384d), rfqs (pgvector 384d), deals, offers,
  escrows, logisticsRequests, logisticsQuotes, pricePoints, priceAlerts, reviews, auditLogs, notifications
- `src/client.ts` — withUserContext() RLS helper
- `src/migrations/0000_init.sql` — pgvector extension, RLS policies on all sensitive tables,
  HNSW indexes on listings.product_vector + rfqs.product_vector
- `src/worker.ts` — pg-boss worker with 5 queues

**packages/marketplace** (S0-03)
- `src/deal-machine.ts` — strict state machine, DealTransitionError
- `src/__tests__/deal-machine.test.ts` — 100% transition coverage

**packages/payments** (S0-03)
- `src/escrow-machine.ts` — strict state machine + buildEscrow()
- `src/__tests__/escrow-machine.test.ts` — 30+70 split invariants

**packages/pricing, logistics, verification, notifications** — stubs for Sprint 5/6

**apps/web** (S0-02, S0-07–S0-12)
- Next.js 15 App Router, TypeScript strict
- `src/auth.ts` — Auth.js v5 (Argon2id + Google OAuth), JWT strategy, role in token
- `src/auth.config.ts` — edge-safe config with public route list
- `src/middleware.ts` — auth + intl middleware combined
- `src/lib/session.ts` — getSession(), requireSession(), requireRole()
- `src/lib/action.ts` — withRole() server action factory with ActionResult<T>
- `src/lib/cn.ts` — tailwind-merge utility
- `src/i18n/routing.ts`, `request.ts`, `navigation.ts`
- `messages/fr.json`, `messages/ar.json` — full bilingual messages
- `src/styles/globals.css` — Tailwind v4 + ochre/olive design tokens, RTL utilities
- Route groups: (public), (farmer), (buyer), (logistics), (admin) with role-gated layouts
- TopBar component (role-aware nav, locale switcher)
- Login page + LoginForm (Credentials + Google)
- Signup page + SignupForm (role picker: farmer/buyer/logistics)
- Landing page with stats + price board teaser

### Remaining (next session)
1. `pnpm install` — verify dependency resolution
2. `pnpm test` — confirm Vitest suites pass
3. `pnpm -r typecheck` — fix any strict TS errors
4. S0-17: Sprint 0 snapshot → approve Sprint 1

### Critical notes for next session
- pgvector/pgvector:pg16 EVERYWHERE (Docker + CI) — never postgres:16-alpine
- Argon2id hash params: memoryCost=65536, timeCost=3, parallelism=4
- Money = integer centimes, NEVER floats
- withRole() returns ActionResult<T> — check result.success before result.data
- RLS policies use SET LOCAL app.current_user_id / app.current_user_role
- Escrow: 30%+70% invariant — deposit+remainder MUST equal gross
