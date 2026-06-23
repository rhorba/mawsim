/**
 * E2E — Public flows (no authentication required)
 * Covers: price board, listing browse, listing detail, homepage
 */
import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders Mawsim homepage with key CTAs', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveTitle(/Mawsim/i);
    // Hero section should be visible
    await expect(page.locator('h1, [data-testid="hero"]').first()).toBeVisible();
  });
});

test.describe('Price board — tableau des prix', () => {
  test('loads without authentication', async ({ page }) => {
    await page.goto('/fr/prix');
    await expect(page).toHaveTitle(/prix/i);
    // Page heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('shows price table with product rows', async ({ page }) => {
    await page.goto('/fr/prix');
    // Either the price table or the empty-state message
    const table = page.locator('table.price-table');
    const emptyState = page.getByText(/aucune donnée|no data/i);
    await expect(table.or(emptyState)).toBeVisible({ timeout: 10_000 });
  });

  test('renders in Arabic (RTL) without layout break', async ({ page }) => {
    await page.goto('/ar/prix');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('shows source badges (ONICL / Mawsim / Réf. manuelle)', async ({ page }) => {
    await page.goto('/fr/prix');
    // Static header always shows "Sources : ONICL · Transactions Mawsim · Références manuelles"
    // regardless of whether there is data in the table
    await expect(page.getByText(/ONICL/).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Public listings browse', () => {
  test('loads listings page without login', async ({ page }) => {
    await page.goto('/fr/listings');
    await expect(page).toHaveURL(/\/fr\/listings/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('renders listing cards or empty state', async ({ page }) => {
    await page.goto('/fr/listings');
    // Cards are <a href="/fr/listings/{id}"> (ListingCard renders a Link)
    // Empty state: "Aucune offre ne correspond à vos critères."
    const cards = page.locator('a[href*="/listings/"]');
    const empty = page.getByText(/aucune offre|aucune annonce|no listings/i);
    await expect(cards.first().or(empty)).toBeVisible({ timeout: 8_000 });
  });

  test('filter by product category', async ({ page }) => {
    await page.goto('/fr/listings?category=cereals');
    await expect(page).toHaveURL(/category=cereals/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('filter by region', async ({ page }) => {
    await page.goto('/fr/listings?region=F%C3%A8s-Mkn%C3%A8s');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Login + Signup pages', () => {
  test('login page renders email + password fields', async ({ page }) => {
    await page.goto('/fr/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter|connexion/i })).toBeVisible();
  });

  test('login page shows Google OAuth button', async ({ page }) => {
    await page.goto('/fr/login');
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('signup page shows role picker (farmer / buyer / logistics)', async ({ page }) => {
    await page.goto('/fr/signup');
    await expect(page.getByRole('button', { name: /producteur/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /acheteur/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /transporteur/i })).toBeVisible();
  });

  test('signup validation rejects missing fields', async ({ page }) => {
    await page.goto('/fr/signup');
    // Submit without filling anything
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    // HTML5 validation should prevent submission; form stays on /signup
    await expect(page).toHaveURL(/\/signup/);
  });

  test('login in Arabic renders RTL', async ({ page }) => {
    await page.goto('/ar/login');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('button').first()).toBeVisible();
  });
});
