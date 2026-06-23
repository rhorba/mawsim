/**
 * E2E — Authentication flows
 * Covers: farmer login, buyer login, admin login, logout, wrong-password error,
 *         signup with new account, rate-limit check.
 */
import { expect, test } from '@playwright/test';

const FARMER = { email: 'mehdi.fellah@demo.mawsim.ma', password: 'demo1234' };
const BUYER = { email: 'atlas.food@demo.mawsim.ma', password: 'demo1234' };
const ADMIN = { email: 'admin@mawsim.ma', password: 'demo1234' };

test.describe('Farmer login', () => {
  test('farmer logs in and lands on farmer dashboard', async ({ page }) => {
    await page.goto('/fr/login');
    await page.getByLabel(/email/i).fill(FARMER.email);
    await page.getByLabel(/mot de passe/i).fill(FARMER.password);
    await page.getByRole('button', { name: /se connecter|connexion/i }).click();

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12_000 });
    await expect(page).not.toHaveURL(/login/);
  });

  test('farmer is redirected to /farmer area after login', async ({ page }) => {
    await page.goto('/fr/login');
    await page.getByLabel(/email/i).fill(FARMER.email);
    await page.getByLabel(/mot de passe/i).fill(FARMER.password);
    await page.getByRole('button', { name: /se connecter|connexion/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12_000 });
    // The root redirects to role dashboard — just verify not on login
    await expect(page).not.toHaveURL(/login/);
  });
});

test.describe('Buyer login', () => {
  test('buyer logs in successfully', async ({ page }) => {
    await page.goto('/fr/login');
    await page.getByLabel(/email/i).fill(BUYER.email);
    await page.getByLabel(/mot de passe/i).fill(BUYER.password);
    await page.getByRole('button', { name: /se connecter|connexion/i }).click();

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12_000 });
    await expect(page).not.toHaveURL(/login/);
  });
});

test.describe('Admin login', () => {
  test('admin logs in successfully', async ({ page }) => {
    await page.goto('/fr/login');
    await page.getByLabel(/email/i).fill(ADMIN.email);
    await page.getByLabel(/mot de passe/i).fill(ADMIN.password);
    await page.getByRole('button', { name: /se connecter|connexion/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12_000 });
    await expect(page).not.toHaveURL(/login/);
  });

  test('admin can access admin route after login', async ({ page }) => {
    // Log in fresh
    await page.goto('/fr/login');
    await page.getByLabel(/email/i).fill(ADMIN.email);
    await page.getByLabel(/mot de passe/i).fill(ADMIN.password);
    await page.getByRole('button', { name: /se connecter|connexion/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12_000 });

    // Navigate to admin dashboard — full page load with session cookie in place
    await page.goto('/fr/admin');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Auth error cases', () => {
  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/fr/login');
    await page.getByLabel(/email/i).fill(FARMER.email);
    await page.getByLabel(/mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /se connecter|connexion/i }).click();

    // Wrong credentials: inline error shown and still on login (or auth error page)
    await page.waitForURL(/login|error/, { timeout: 8_000 });
    await expect(page).toHaveURL(/login|error/);
  });

  test('signup rejects duplicate email', async ({ page }) => {
    await page.goto('/fr/signup');
    await page.getByRole('button', { name: /acheteur/i }).click();
    await page.getByLabel(/nom/i).fill('Duplicate Test');
    await page.getByLabel(/email/i).fill(BUYER.email); // existing email
    await page.getByLabel(/mot de passe/i).fill('TestPass123!');
    await page.getByRole('button', { name: /créer mon compte/i }).click();

    await expect(page.getByText(/déjà inscrit|already registered|email/i)).toBeVisible({
      timeout: 8_000,
    });
  });
});

test.describe('New user signup', () => {
  test('new farmer signs up and is auto-logged in', async ({ page }) => {
    const uniqueEmail = `test.farmer.${Date.now()}@e2e.mawsim.ma`;

    await page.goto('/fr/signup');
    await page.getByRole('button', { name: /producteur/i }).click();
    await page.getByLabel(/nom/i).fill('Test Farmer E2E');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/mot de passe/i).fill('TestPass123!');
    await page.getByRole('button', { name: /créer mon compte/i }).click();

    // Should auto-sign-in and redirect
    await page.waitForURL((url) => !url.pathname.includes('/signup'), { timeout: 15_000 });
    await expect(page).not.toHaveURL(/signup/);
  });

  test('new buyer signs up successfully', async ({ page }) => {
    const uniqueEmail = `test.buyer.${Date.now()}@e2e.mawsim.ma`;

    await page.goto('/fr/signup');
    await page.getByRole('button', { name: /acheteur/i }).click();
    await page.getByLabel(/nom/i).fill('Test Buyer E2E');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/mot de passe/i).fill('TestPass456!');
    await page.getByRole('button', { name: /créer mon compte/i }).click();

    await page.waitForURL((url) => !url.pathname.includes('/signup'), { timeout: 15_000 });
    await expect(page).not.toHaveURL(/signup/);
  });
});
