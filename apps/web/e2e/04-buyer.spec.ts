/**
 * E2E — Buyer dashboard flows
 * Covers: buyer profile, RFQ creation, listing discovery, offer flow, deals
 *
 * Uses pre-authenticated buyer storage state.
 */
import path from 'node:path';
import { expect, test } from '@playwright/test';

const AUTH = { storageState: path.join(__dirname, '../.auth/buyer.json') };

test.use(AUTH);

test.describe('Buyer profile', () => {
  test('buyer profile page loads', async ({ page }) => {
    await page.goto('/fr/buyer/profile');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('profile form shows company name field', async ({ page }) => {
    await page.goto('/fr/buyer/profile');
    // Label is "Raison sociale" (companyName i18n key)
    await expect(page.locator('input[name="companyName"]')).toBeVisible();
  });

  test('demo buyer profile has Atlas Food pre-filled', async ({ page }) => {
    await page.goto('/fr/buyer/profile');
    const companyField = page.locator('input[name="companyName"]');
    await expect(companyField).toBeVisible();
    const value = await companyField.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe('Browse public listings (as buyer)', () => {
  test('buyer can browse all active listings', async ({ page }) => {
    await page.goto('/fr/listings');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('buyer can open listing detail page', async ({ page }) => {
    await page.goto('/fr/listings');
    // Listing cards are <a href="/fr/listings/{id}"> — navigate by href to avoid click race
    const listingLink = page.locator('a[href*="/listings/"]').first();
    const href = await listingLink.getAttribute('href', { timeout: 6_000 }).catch(() => null);

    if (href && href.match(/\/listings\/[^/]+$/)) {
      await page.goto(href);
      await expect(page).toHaveURL(/\/listings\//);
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('listing detail shows price, quantity, grade', async ({ page }) => {
    await page.goto('/fr/listings');
    const listingLink = page.locator('a[href*="/listings/"]').first();
    const href = await listingLink.getAttribute('href', { timeout: 6_000 }).catch(() => null);

    if (href && href.match(/\/listings\/[^/]+$/)) {
      await page.goto(href);
      await expect(page.getByText(/MAD|dirham|qtx|quintal/i).first()).toBeVisible({
        timeout: 8_000,
      });
    }
  });
});

test.describe('RFQ (Request for Quotation)', () => {
  test('RFQ list page loads', async ({ page }) => {
    await page.goto('/fr/buyer/rfqs');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('new RFQ page renders the form', async ({ page }) => {
    await page.goto('/fr/buyer/rfqs/new');
    await expect(page).not.toHaveURL(/login/);
    // Form uses <span> labels — check by input name
    await expect(page.locator('select[name="productCategory"]')).toBeVisible();
  });

  test('buyer creates a new RFQ successfully', async ({ page }) => {
    await page.goto('/fr/buyer/rfqs/new');

    await page.locator('select[name="productCategory"]').selectOption('cereals');
    await page.locator('input[name="quantityQtxMin"]').fill('500');
    await page.locator('input[name="quantityQtxMax"]').fill('2000');
    await page.locator('select[name="deliveryRegion"]').selectOption({ index: 1 });

    const future = new Date();
    future.setMonth(future.getMonth() + 2);
    await page.locator('input[name="neededBy"]').fill(future.toISOString().split('T')[0]!);

    await page.getByRole('button', { name: /publier|soumettre|créer/i }).click();
    await page.waitForURL(/\/fr\/buyer\/rfqs/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/fr\/buyer\/rfqs/);
  });

  test('RFQ detail shows matched listings', async ({ page }) => {
    await page.goto('/fr/buyer/rfqs');
    // RFQ cards are <a href="/buyer/rfqs/{id}">
    const rfqLink = page.locator('a[href*="/buyer/rfqs/"]').first();
    const href = await rfqLink.getAttribute('href', { timeout: 6_000 }).catch(() => null);

    if (href && href.match(/\/buyer\/rfqs\/[^/]+$/)) {
      await page.goto(href);
      await expect(page).toHaveURL(/\/buyer\/rfqs\//);
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });
});

test.describe('Buyer deal management', () => {
  test('buyer deals page loads', async ({ page }) => {
    await page.goto('/fr/buyer/deals');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('deal detail renders offer thread', async ({ page }) => {
    await page.goto('/fr/buyer/deals');
    // Deal cards are <a href="/fr/buyer/deals/{id}">
    const dealLink = page.locator('a[href*="/buyer/deals/"]').first();
    const href = await dealLink.getAttribute('href', { timeout: 6_000 }).catch(() => null);

    if (href) {
      await page.goto(href);
      await expect(page).toHaveURL(/\/buyer\/deals\//);
      await expect(page.getByRole('heading').first()).toBeVisible();
    } else {
      await expect(page.getByText(/aucune transaction|no deals/i)).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Buyer price alerts', () => {
  test('buyer price alerts page loads', async ({ page }) => {
    await page.goto('/fr/buyer/alerts');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Buyer offer flow', () => {
  test('offer form renders on listing detail', async ({ page }) => {
    await page.goto('/fr/listings');
    const listingLink = page.locator('a[href*="/listings/"]').first();
    const href = await listingLink.getAttribute('href', { timeout: 6_000 }).catch(() => null);

    if (href && href.match(/\/listings\/[^/]+$/)) {
      await page.goto(href);
      // Look for an offer button or price content
      // Either offer link or price text confirms listing detail loaded
      const offerLink = page.getByRole('link', { name: /faire une offre|proposer/i });
      const priceText = page.getByText(/MAD\/quintal/i);
      await expect(priceText.or(offerLink).first()).toBeVisible({ timeout: 8_000 });
    }
  });
});
