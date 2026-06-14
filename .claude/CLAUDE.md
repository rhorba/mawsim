# Mawsim — Claude Code Team Framework

> Read `../CLAUDE.md` for full business rules, data model, and tech stack.
> This file governs HOW the AI team works.

---

## Autonomous Mode (default)

- **Design choices**: Always pick 🟡 **BALANCED**.
- **Specialist handoffs**: Proceed automatically.
- **Testing**: After ANY code task, auto-invoke Tester.

### Stop only for
1. Blocker (CMI API creds, broken dep, pgvector migration fails)
2. Scope gap not in `../CLAUDE.md`
3. DB schema breaking change
4. Security/financial risk
5. Sprint boundary

---

## Sprint System

| Sprint | Goal |
|---|---|
| **Sprint 0** | Scaffold + Auth + RBAC + RLS + pgvector |
| **Sprint 1** | Data model + Farmer/Buyer/Logistics profiles + demo seed |
| **Sprint 2** | Marketplace: listings (post + public browse SSR) + RFQ |
| **Sprint 3** | Offer/negotiation engine + contract PDF |
| **Sprint 4** | Payments & Escrow (30% deposit + 70% delivery) |
| **Sprint 5** | Price board + alerts + logistics coordination |
| **Sprint 6** | Quality verification + reviews + notifications + email |
| **Sprint 7** | Admin dashboard + i18n FR/AR + RTL + security + deploy → v0.1 |

---

## Auto-Handoff Protocol

| When | Auto-trigger |
|---|---|
| Backend/Frontend DONE | → Tester |
| DB schema change | → DBA + Security |
| Marketplace/matching logic | → Market Engine specialist |
| Escrow/payments | → Payments Engineer + Test Architect |
| Pricing/alerts | → Market Engine + Backend |
| Logistics state machine | → Logistics Engineer |
| Certification docs | → Verification + Security |
| Sprint all-green | → Project Monitor: snapshot |

---

## Specialist Skills

| Specialist | Trigger |
|---|---|
| Orchestrator | Session start, routing |
| Project Manager | Scope, risks |
| Scrum Master | Sprint planning |
| Tech Lead | ADRs, stack |
| DBA | Schema, RLS, pgvector migrations |
| Backend Dev | Server actions, API routes |
| Frontend Dev | All web pages, SSR, RTL |
| Market Engine | RFQ matching, deal state machine, contract PDF |
| Logistics Engineer | Logistics request/quote/match state machine |
| Payments Engineer | Escrow state machine (30%/70%), CMI adapter |
| Tester | Vitest, Playwright |
| Test Architect | Adversarial, escrow edge cases, double-bid |
| Security Engineer | Auth, RBAC, bank details PII, cert docs |
| DevOps/DevSecOps | Docker, CI (pgvector/pgvector:pg16), secrets |
| Deployment | Vercel + Docker verify |
| UX Designer | Wireframes, mobile-first farmer UX |
| UI Designer | Ochre/olive tokens, data tables |
| Content Editor | FR/AR/agricultural terminology |
| Project Monitor | Logs, KPIs, snapshots |

---

## Mawsim-Specific Non-Negotiables

1. **Price board is always public** — no login required. This is the acquisition engine.
2. **Escrow is 30% + 70% split** — never full upfront. Deposit on contract, remainder on delivery. This builds trust with both sides. No shortcut.
3. **Farmer bank details encrypted** — at rest, role-gated (farmer + admin only), access audit-logged.
4. **Certification documents** — private R2 bucket, signed URLs, admin + document owner only. Same strictness as Riaya CIN docs.
5. **Deal state machine is strict** — no skipping states. AuditLog on every transition.
6. **Contract PDF is bilingual (FR/AR)** — legally, Moroccan contracts must be accessible to both parties in their language.
7. **pgvector for RFQ matching** — use pgvector/pgvector:pg16 in CI (NOT standard postgres:16-alpine).
8. **Commission is fixed at 4%** — no dynamic pricing, no hidden fees. Trust requires transparency.
9. **RTL is equal** — Arabic-speaking farmers are the majority target.
10. **Seasonality-aware** — the platform should surface relevant products for the current agricultural season.

---

## YAGNI Gate
```
"Does Mawsim v0.1 need this for the DoD (../CLAUDE.md §12)?"
  YES → Build it   |   NO → v0.2 backlog only
```

## 3-Option Pattern (always pick 🟡 BALANCED)
```
🟢 SIMPLE | 🟡 BALANCED ← SELECTED | 🔴 COMPREHENSIVE
→ "Proceeding with 🟡 BALANCED approach: [description]"
```
