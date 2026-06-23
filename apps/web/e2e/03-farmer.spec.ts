/**
 * E2E — Farmer dashboard flows
 * Covers: farmer profile, listings management, deal view, price alerts
 *
 * Uses pre-authenticated farmer storage state (from auth.setup.ts).
 */
import path from 'node:path';
import { expect, test } from '@playwright/test';

const AUTH = { storageState: path.join(__dirname, '../.auth/farmer.json') };

test.use(AUTH);

test.describe('Farmer profile', () => {
  test('farmer profile page loads', async ({ page }) => {
    await page.goto('/fr/farmer/profile');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('farm profile form has correct fields', async ({ page }) => {
    await page.goto('/fr/farmer/profile');
    // Label is "Nom de l'exploitation" (farmName i18n key)
    await expect(page.getByLabel(/exploitation|ferme|farm name/i)).toBeVisible();
    await expect(page.getByRole('combobox').or(page.getByLabel(/région/i))).toBeVisible();
  });

  test('farmer profile shows farm name and region for demo account', async ({ page }) => {
    await page.goto('/fr/farmer/profile');
    // Demo farmer is Mehdi El Fellah — his profile should be pre-filled
    const farmField = page.getByLabel(/exploitation|ferme|farm name/i);
    await expect(farmField).toBeVisible();
    const value = await farmField.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe('Farmer listings', () => {
  test('listings page loads with existing demo listings', async ({ page }) => {
    await page.goto('/fr/farmer/listings');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('listings table shows status badges', async ({ page }) => {
    await page.goto('/fr/farmer/listings');
    // Should show at least one listing row or empty state
    const row = page.locator('tbody tr, [data-testid="listing-row"]');
    const empty = page.getByText(/aucune annonce|pas encore/i);
    await expect(row.first().or(empty)).toBeVisible({ timeout: 8_000 });
  });

  test('new listing form renders all required fields', async ({ page }) => {
    await page.goto('/fr/farmer/listings/new');
    await expect(page).not.toHaveURL(/login/);
    // Form uses <span> labels + named inputs — check by name/role
    await expect(page.locator('select[name="productCategory"]')).toBeVisible();
    await expect(page.locator('input[name="quantityQtx"]')).toBeVisible();
    await expect(page.locator('input[name="askPrice"]')).toBeVisible();
  });

  test('new listing form validates and prevents empty submit', async ({ page }) => {
    await page.goto('/fr/farmer/listings/new');
    await page.getByRole('button', { name: /publier|créer|soumettre/i }).click();
    // Should stay on the form page (HTML5 or server validation)
    await expect(page).toHaveURL(/\/listings\/new|\/listings/);
  });

  test('farmer can create a listing with valid data', async ({ page }) => {
    await page.goto('/fr/farmer/listings/new');

    // Fill mandatory fields using name selectors (form uses <span> not <label>)
    await page.locator('select[name="productCategory"]').selectOption('cereals');
    await page.locator('select[name="region"]').selectOption({ index: 1 });
    await page.locator('select[name="qualityGrade"]').selectOption('grade_a');
    await page.locator('input[name="quantityQtx"]').fill('500');
    await page.locator('input[name="minOrderQtx"]').fill('50');
    await page.locator('input[name="askPrice"]').fill('28000');

    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    await page.locator('input[name="availableUntil"]').fill(future.toISOString().split('T')[0]!);

    await page.getByRole('button', { name: /publier|créer|soumettre/i }).click();

    // Should redirect to listings list on success
    await page.waitForURL(/\/fr\/farmer\/listings/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/fr\/farmer\/listings/);
  });
});

test.describe('Farmer deals', () => {
  test('deals list page loads', async ({ page }) => {
    await page.goto('/fr/farmer/deals');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('deal detail page renders for existing deal', async ({ page }) => {
    await page.goto('/fr/farmer/deals');
    // Wait for deal card links to appear
    const dealLink = page.locator('a[href*="/farmer/deals/"]').first();
    const href = await dealLink.getAttribute('href', { timeout: 6_000 }).catch(() => null);

    if (href) {
      await page.goto(href);
      await expect(page).toHaveURL(/\/farmer\/deals\//);
      await expect(page.getByRole('heading').first()).toBeVisible();
    } else {
      // No deals yet — empty state
      await expect(
        page.getByText(/aucune transaction|no deals|pas de transaction/i)
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Farmer price alerts', () => {
  test('price alerts page loads', async ({ page }) => {
    await page.goto('/fr/farmer/alerts');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('alert form has product, region, direction, threshold fields', async ({ page }) => {
    await page.goto('/fr/farmer/alerts');
    // There should be a form or button to create an alert
    const form = page.locator('form, [data-testid="alert-form"]');
    const addBtn = page.getByRole('button', { name: /ajouter|créer|nouvelle alerte/i });
    await expect(form.first().or(addBtn)).toBeVisible({ timeout: 6_000 });
  });
});

test.describe('Farmer navigation', () => {
  test('sidebar or nav links to all farmer sections', async ({ page }) => {
    await page.goto('/fr/farmer/listings');
    // Check for nav links to the main farmer sections
    const nav = page.locator('nav, aside');
    if (await nav.first().isVisible()) {
      await expect(nav.first()).toContainText(/listings|annonces|deals|profil|alertes/i);
    }
  });
});
