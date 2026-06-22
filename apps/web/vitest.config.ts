import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    // Exclude Playwright E2E specs — those run via `pnpm test:e2e`, not vitest
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.e2e.*'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
