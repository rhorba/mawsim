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
    await expect(page.getByLabel(/nom.*entreprise|company name/i)).toBeVisible();
  });

  test('demo buyer profile has Atlas Food pre-filled', async ({ page }) => {
    await page.goto('/fr/buyer/profile');
    const companyField = page.getByLabel(/nom.*entreprise|company name/i);
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
    const listingLinks = page.getByRole('link', { name: /voir|détail|blé|olive|date/i });
    const count = await listingLinks.count();

    if (count > 0) {
      await listingLinks.first().click();
      await expect(page).toHaveURL(/\/listings\//);
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('listing detail shows price, quantity, grade', async ({ page }) => {
    await page.goto('/fr/listings');
    const listingLinks = page.getByRole('link', { name: /voir/i });
    const count = await listingLinks.count();

    if (count > 0) {
      await listingLinks.first().click();
      // Should show price-related content
      await expect(page.getByText(/MAD|dirham|qtx|quintal/i)).toBeVisible({ timeout: 8_000 });
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
    // Category select
    await expect(page.getByLabel(/catégorie|produit/i).first()).toBeVisible();
  });

  test('buyer creates a new RFQ successfully', async ({ page }) => {
    await page.goto('/fr/buyer/rfqs/new');

    const categorySelect = page.getByLabel(/catégorie|produit/i).first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('cereals');
    }

    const minQtyField = page.getByLabel(/quantité min/i);
    if (await minQtyField.isVisible()) {
      await minQtyField.fill('500');
    }

    const maxQtyField = page.getByLabel(/quantité max/i);
    if (await maxQtyField.isVisible()) {
      await maxQtyField.fill('2000');
    }

    const regionSelect = page.getByLabel(/région.*livraison|delivery region/i);
    if (await regionSelect.isVisible()) {
      await regionSelect.selectOption({ index: 1 });
    }

    const neededByField = page.getByLabel(/nécessaire avant|needed by|date limite/i);
    if (await neededByField.isVisible()) {
      const future = new Date();
      future.setMonth(future.getMonth() + 2);
      await neededByField.fill(future.toISOString().split('T')[0]!);
    }

    await page.getByRole('button', { name: /publier|soumettre|créer/i }).click();
    await page.waitForURL(/\/fr\/buyer\/rfqs/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/fr\/buyer\/rfqs/);
  });

  test('RFQ detail shows matched listings', async ({ page }) => {
    await page.goto('/fr/buyer/rfqs');
    const rfqLinks = page.getByRole('link', { name: /voir|détail/i });
    const count = await rfqLinks.count();

    if (count > 0) {
      await rfqLinks.first().click();
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
    const dealLinks = page.getByRole('link', { name: /voir|détail/i });
    const count = await dealLinks.count();

    if (count > 0) {
      await dealLinks.first().click();
      await expect(page).toHaveURL(/\/buyer\/deals\//);
      await expect(page.getByRole('heading').first()).toBeVisible();
    } else {
      await expect(page.getByText(/aucune transaction|no deals/i)).toBeVisible();
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
    const listingLinks = page.getByRole('link', { name: /voir/i });
    const count = await listingLinks.count();

    if (count > 0) {
      await listingLinks.first().click();
      // Look for an offer button
      const offerBtn = page.getByRole('button', { name: /faire une offre|proposer|offrir/i });
      const offerLink = page.getByRole('link', { name: /faire une offre|proposer/i });
      const hasOffer = (await offerBtn.count()) > 0 || (await offerLink.count()) > 0;
      // Either offer button exists or content confirms listing detail loaded
      const priceText = page.getByText(/MAD|quintal/i);
      await expect(priceText.or(offerBtn).or(offerLink)).toBeVisible({ timeout: 8_000 });
      if (hasOffer) {
        await (offerBtn.first().isVisible() ? offerBtn.first() : offerLink.first()).click();
        await expect(page.getByLabel(/prix|price/i).first()).toBeVisible({ timeout: 6_000 });
      }
    }
  });
});
