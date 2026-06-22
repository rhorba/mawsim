import path from 'node:path';
/**
 * Auth setup — runs once before the main test suite.
 * Signs in as each demo role and saves the browser storage state so tests can
 * reuse authenticated sessions without repeating login in every spec.
 *
 * Requires the demo seed to have been applied:
 *   pnpm db:seed
 *
 * Storage files written to apps/web/.auth/ (git-ignored).
 */
import { expect, test as setup } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  storagePath: string
) {
  await page.goto(`${BASE}/fr/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: /connexion/i }).click();

  // Wait for redirect away from login page (any protected route loads)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
  await expect(page).not.toHaveURL(/login/);

  await page.context().storageState({ path: storagePath });
}

const AUTH_DIR = path.join(__dirname, '../.auth');

setup('authenticate as farmer (Mehdi)', async ({ page }) => {
  await loginAs(
    page,
    'mehdi.fellah@demo.mawsim.ma',
    'demo1234',
    path.join(AUTH_DIR, 'farmer.json')
  );
});

setup('authenticate as buyer (Atlas Food)', async ({ page }) => {
  await loginAs(page, 'atlas.food@demo.mawsim.ma', 'demo1234', path.join(AUTH_DIR, 'buyer.json'));
});

setup('authenticate as admin', async ({ page }) => {
  await loginAs(page, 'admin@mawsim.ma', 'demo1234', path.join(AUTH_DIR, 'admin.json'));
});
