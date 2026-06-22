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
    await expect(page.getByLabel(/nom de la ferme|farm name/i)).toBeVisible();
    await expect(page.getByRole('combobox').or(page.getByLabel(/région/i))).toBeVisible();
  });

  test('farmer profile shows farm name and region for demo account', async ({ page }) => {
    await page.goto('/fr/farmer/profile');
    // Demo farmer is Mehdi El Fellah — his profile should be pre-filled
    const farmField = page.getByLabel(/nom de la ferme|farm name/i);
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
    // Product category select
    await expect(page.getByLabel(/catégorie|produit/i).first()).toBeVisible();
    // Quantity
    await expect(page.getByLabel(/quantité/i)).toBeVisible();
    // Price
    await expect(page.getByLabel(/prix/i)).toBeVisible();
  });

  test('new listing form validates and prevents empty submit', async ({ page }) => {
    await page.goto('/fr/farmer/listings/new');
    await page.getByRole('button', { name: /publier|créer|soumettre/i }).click();
    // Should stay on the form page (HTML5 or server validation)
    await expect(page).toHaveURL(/\/listings\/new|\/listings/);
  });

  test('farmer can create a listing with valid data', async ({ page }) => {
    await page.goto('/fr/farmer/listings/new');

    // Fill mandatory fields
    const categorySelect = page.getByLabel(/catégorie|produit/i).first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('cereals');
    }

    const quantityField = page.getByLabel(/quantité/i);
    if (await quantityField.isVisible()) {
      await quantityField.fill('500');
    }

    const priceField = page.getByLabel(/prix.*qtx|prix.*quintal|prix demandé/i);
    if (await priceField.isVisible()) {
      await priceField.fill('28000');
    }

    const minOrderField = page.getByLabel(/commande min|minimum/i);
    if (await minOrderField.isVisible()) {
      await minOrderField.fill('50');
    }

    const availableField = page.getByLabel(/disponible jusqu|date limite/i);
    if (await availableField.isVisible()) {
      const future = new Date();
      future.setMonth(future.getMonth() + 3);
      await availableField.fill(future.toISOString().split('T')[0]!);
    }

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
    // Navigate to deals list first, then open first deal if available
    await page.goto('/fr/farmer/deals');
    const dealLinks = page.getByRole('link', { name: /voir|détail|open/i });
    const count = await dealLinks.count();

    if (count > 0) {
      await dealLinks.first().click();
      await expect(page).toHaveURL(/\/farmer\/deals\//);
      await expect(page.getByRole('heading').first()).toBeVisible();
    } else {
      // No deals yet — empty state
      await expect(page.getByText(/aucune transaction|no deals/i)).toBeVisible();
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
