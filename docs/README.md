# Mawsim — E2E Test Recordings

This directory contains Playwright E2E test recordings, screenshots, and HTML reports.

## Structure

```
docs/
└── e2e-results/
    ├── html-report/         ← Open index.html in a browser for the full interactive report
    ├── 01-public.spec.ts/   ← Per-test video + screenshot artifacts
    ├── 02-auth.spec.ts/
    ├── 03-farmer.spec.ts/
    ├── 04-buyer.spec.ts/
    ├── 05-deal-flow.spec.ts/
    └── 06-admin.spec.ts/
```

## Running E2E tests (produces videos)

**Prerequisites:**
1. PostgreSQL running with seed data: `docker-compose up -d db && pnpm db:seed`
2. Playwright browsers installed: `pnpm --filter web exec playwright install chromium`

**Record all scenarios:**
```bash
pnpm test:e2e
```

The command starts the Next.js dev server automatically, runs all 6 scenario suites,
and saves `.webm` video files to `docs/e2e-results/`.

**View the HTML report:**
```bash
pnpm --filter web exec playwright show-report docs/e2e-results/html-report
```

## Scenarios covered

| File | Scenarios |
|---|---|
| `01-public.spec.ts` | Homepage, price board (FR + AR), listings browse, login/signup pages |
| `02-auth.spec.ts` | Farmer/buyer/admin login, wrong password, duplicate email, new account signup |
| `03-farmer.spec.ts` | Farmer profile, listing creation, deal view, price alerts |
| `04-buyer.spec.ts` | Buyer profile, RFQ creation, offer flow, deal management, price alerts |
| `05-deal-flow.spec.ts` | Deal states, escrow UI, contract PDF link, logistics, delivery confirm |
| `06-admin.spec.ts` | KPI dashboard, deals table, dispute queue, ONICL prices, cert queue, role isolation |

## Demo accounts (seed data)

| Role | Email | Password |
|---|---|---|
| Farmer | mehdi.fellah@demo.mawsim.ma | demo1234 |
| Buyer | atlas.food@demo.mawsim.ma | demo1234 |
| Admin | admin@mawsim.ma | demo1234 |
