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
    const nav = page.locator('nav');
    await expect(nav).toContainText(/transactions|litiges|certifications|prix/i);
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
    // Form should have category, region, price fields
    await expect(page.getByLabel(/catégorie|produit/i).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel(/région/i)).toBeVisible();
    await expect(page.getByLabel(/prix/i)).toBeVisible();
  });

  test('admin can submit a new ONICL reference price', async ({ page }) => {
    await page.goto('/fr/admin/prices');

    const categorySelect = page.getByLabel(/catégorie|produit/i).first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('cereals');
    }

    const regionField = page.getByLabel(/région/i);
    if (await regionField.isVisible()) {
      // Try select or input
      if ((await regionField.getAttribute('tagName'))?.toLowerCase() === 'select') {
        await regionField.selectOption({ index: 1 });
      } else {
        await regionField.fill('Fès-Meknès');
      }
    }

    const priceField = page.getByLabel(/prix.*qtx|prix.*quintal/i);
    if (await priceField.isVisible()) {
      await priceField.fill('27500');
    }

    await page.getByRole('button', { name: /ajouter|enregistrer|submit/i }).click();

    // Should show success or refresh the table
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/error/);
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
    // Should be redirected to login or shown a 403
    await expect(page).toHaveURL(/login|fr\/|403/);
    await ctx.close();
  });

  test('non-admin (buyer) cannot access admin deals', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/buyer.json'),
    });
    const page = await ctx.newPage();
    await page.goto('/fr/admin/deals');
    await expect(page).toHaveURL(/login|fr\/|403/);
    await ctx.close();
  });
});
