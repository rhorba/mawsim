import path from 'node:path';
/**
 * Shared Playwright fixtures — provides pre-authenticated page contexts
 * for farmer, buyer, and admin roles via saved storage state.
 */
import { test as base } from '@playwright/test';

const AUTH_DIR = path.join(__dirname, '../.auth');

export const test = base.extend<{
  farmerPage: import('@playwright/test').Page;
  buyerPage: import('@playwright/test').Page;
  adminPage: import('@playwright/test').Page;
}>({
  farmerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'farmer.json'),
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  buyerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'buyer.json'),
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'admin.json'),
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
