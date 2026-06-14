# Sprint 0 — Scaffold + Auth + RBAC + RLS + pgvector

**Goal**: `pnpm dev` works. Auth (4 roles). Postgres + pgvector. Role isolation proven.

**Duration**: 1–2 sessions | **Auto-handoff**: ENABLED

## Must
- [x] S0-01 — pnpm workspace: `apps/web`, `packages/core|db|marketplace|pricing|logistics|payments|verification|notifications` — **Tech Lead**
- [x] S0-02 — `apps/web` Next.js 15 App Router + TypeScript strict + Biome — **Tech Lead**
- [x] S0-03 — `packages/core`: `Money` type, `Role` enum (farmer/buyer/logistics/admin), RBAC, Zod — **Tech Lead**
- [x] S0-04 — `packages/db`: Drizzle config + pgvector init + full schema — **DBA**
- [x] S0-05 — RLS: `withUserContext` helper; policies on all sensitive tables — **DBA** → Security
- [x] S0-06 — DB init: `CREATE EXTENSION IF NOT EXISTS vector`; RLS-bound app role; HNSW indexes — **DBA** → DevOps
- [x] S0-07 — Auth.js v5: email+Argon2id + Google OAuth; session `{ userId, role }` — **Security Engineer**
- [x] S0-08 — `withRole()` server action factory (returns ActionResult) — **Backend Dev**
- [x] S0-09 — Signup route + login page + signup page with role picker — **Backend Dev**
- [x] S0-10 — next-intl fr/ar + `[locale]` layout + RTL `dir` switch — **Frontend Dev**
- [x] S0-11 — Tailwind v4 + ochre/olive tokens + semantic colors + grade/status CSS — **UI Designer**
- [x] S0-12 — App shell: role-aware nav (4 roles), TopBar, role-gated layouts — **Frontend Dev**
- [x] S0-13 — Docker Compose (pgvector/pgvector:pg16 + web + worker + caddy) + .env.example — **DevOps**
- [x] S0-14 — pg-boss worker: 5 queues (price.alerts, deal.expiry, escrow.sweep, logistics.sweep, auction.close) — **DevOps**
- [x] S0-15 — GitHub Actions CI: **pgvector/pgvector:pg16 image** (mandatory) + gitleaks — **DevOps**
- [x] S0-16 — Vitest: role isolation, bank-details access, deal machine (all transitions), escrow 30+70 math — **Tester**
- [x] S0-17 — `pnpm install` + `pnpm test` + `typecheck` + `lint` + `build` verified green — **2026-06-12**

## DoD — Sprint 0
- [x] `pnpm install`/`build`/`test`/`lint`/`typecheck` pass (Docker/pgvector verified separately)
- [x] Auth: 4 roles; session correct; protected routes redirect to login
- [x] Role isolation tests written; FR/AR routing + RTL; deal machine 100% covered

## Closed 2026-06-12 — Sprint 0 GREEN
Fixes applied this session:
1. `packages/db/src/worker.ts` — pg-boss v10 `WorkHandler` now takes `Job[]` (batch)
2. Auth.js tables conformed to `@auth/drizzle-adapter` contract: `users.emailVerified`
   boolean→nullable timestamp (+`image`); `accounts` snake_case keys + integer `expires_at`;
   `sessions.sessionToken` is PK. Signup route writes `emailVerified: null`.
3. next-auth v5 + pnpm TS2742 — explicit `NextAuthResult` annotations in `auth.ts`/`middleware.ts`
4. `apps/web` deps: added `drizzle-orm`, `@radix-ui/react-slot`; Button gained `asChild` (Slot)
5. `i18n/request.ts` returns `.default` messages object
6. `next.config.ts` — `transpilePackages` for all `@mawsim/*` + webpack `extensionAlias` (.js→.ts)
7. Biome: `useLiteralKeys` off (bracket-notation convention), `noNonNullAssertion` off in tests,
   `next-env.d.ts` ignored; `type="button"` + SVG `<title>` a11y fixes

Verified: lint clean · typecheck 9/9 · 81 tests pass · `pnpm build` 10 pages + middleware OK
