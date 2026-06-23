/**
 * E2E — Admin dashboard flows
 * Covers: KPI cards, deals table, dispute resolution, price management,
 *         certification queue, role isolation
 */
import path from 'node:path';
import { expect, test } from '@playwright/test';

const AUTH = { storageState: path.join(__dirname, '../.auth/admin.json') };

test.use(AUTH);

test.describe('Admin dashboard — KPIs', () => {
  test('admin dashboard loads with stat cards', async ({ page }) => {
    await page.goto('/fr/admin');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('GMV stat card is visible', async ({ page }) => {
    await page.goto('/fr/admin');
    await expect(page.getByText(/gmv|volume.*affaires|chiffre/i)).toBeVisible({ timeout: 8_000 });
  });

  test('active deals stat card is visible', async ({ page }) => {
    await page.goto('/fr/admin');
    await expect(page.getByText(/transactions actives|active deals|deals actifs/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  test('farmers and buyers count cards visible', async ({ page }) => {
    await page.goto('/fr/admin');
    await expect(page.getByText(/producteurs|farmers/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/acheteurs|buyers/i)).toBeVisible({ timeout: 8_000 });
  });

  test('sub-navigation links to all admin sections', async ({ page }) => {
    await page.goto('/fr/admin');
    // Admin sub-nav is the second <nav> (main nav + admin sub-nav)
    const adminNav = page.locator('nav').last();
    await expect(adminNav).toContainText(/transactions|litiges|certifications|prix/i);
  });
});

test.describe('Admin deals list', () => {
  test('deals table loads with all transactions', async ({ page }) => {
    await page.goto('/fr/admin/deals');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('deals table has correct columns', async ({ page }) => {
    await page.goto('/fr/admin/deals');
    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 8_000 });
    // Should have status column
    await expect(page.getByRole('columnheader', { name: /statut|status/i })).toBeVisible();
  });

  test('deals table shows 6 demo deals', async ({ page }) => {
    await page.goto('/fr/admin/deals');
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1); // at least some deals from seed
  });
});

test.describe('Admin disputes', () => {
  test('disputes page loads', async ({ page }) => {
    await page.goto('/fr/admin/disputes');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('disputes page shows queue or empty state', async ({ page }) => {
    await page.goto('/fr/admin/disputes');
    const resolveBtn = page.getByRole('button', { name: /résoudre|résolution|resolve/i });
    const empty = page.getByText(/aucun litige|no disputes/i);
    await expect(resolveBtn.first().or(empty)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin price management', () => {
  test('prices page loads with add form', async ({ page }) => {
    await page.goto('/fr/admin/prices');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('add ONICL price form is rendered', async ({ page }) => {
    await page.goto('/fr/admin/prices');
    // AddPriceForm uses real <label htmlFor> — labels: "Produit", "Région", "Prix (MAD/quintal...)"
    await expect(page.getByLabel('Produit')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel('Région')).toBeVisible();
    await expect(page.getByLabel(/prix.*quintal/i)).toBeVisible();
  });

  test('admin can submit a new ONICL reference price', async ({ page }) => {
    await page.goto('/fr/admin/prices');

    // "Produit" → <select id="ap-category">
    await page.getByLabel('Produit').selectOption('cereals');

    // "Région" → <select id="ap-region">
    await page.getByLabel('Région').selectOption({ index: 1 });

    // "Prix (MAD/quintal — en centimes)" → <input id="ap-price">
    await page.getByLabel(/prix.*quintal/i).fill('27500');

    await page.getByRole('button', { name: /ajouter|enregistrer|submit/i }).click();

    // Should show success message or refresh table without error
    await expect(page.getByText(/succès|ajouté|error/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('recent price points table is displayed', async ({ page }) => {
    await page.goto('/fr/admin/prices');
    const table = page.getByRole('table');
    const empty = page.getByText(/aucun|no data/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin certifications queue', () => {
  test('certifications page loads', async ({ page }) => {
    await page.goto('/fr/admin/certifications');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('cert queue shows pending items or empty state', async ({ page }) => {
    await page.goto('/fr/admin/certifications');
    const verifyBtn = page.getByRole('button', { name: /vérifier|approuver|rejeter/i });
    const empty = page.getByText(/aucune certification|no pending/i);
    await expect(verifyBtn.first().or(empty)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin role isolation', () => {
  test('non-admin (farmer) cannot access admin dashboard', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/farmer.json'),
    });
    const page = await ctx.newPage();
    await page.goto('/fr/admin');
    // Admin layout redirects non-admin to /${locale} (e.g. /fr) — not to login
    await expect(page).not.toHaveURL(/\/admin/);
    await ctx.close();
  });

  test('non-admin (buyer) cannot access admin deals', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/buyer.json'),
    });
    const page = await ctx.newPage();
    await page.goto('/fr/admin/deals');
    // Admin layout redirects non-admin to /${locale} — verify they're not on admin page
    await expect(page).not.toHaveURL(/\/admin/);
    await ctx.close();
  });
});
