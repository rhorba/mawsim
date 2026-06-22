import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Videos + traces + screenshots land in docs/e2e-results/ at repo root
const DOCS_DIR = path.resolve(__dirname, '../../docs/e2e-results');

export default defineConfig({
  testDir: './e2e',
  outputDir: DOCS_DIR,
  fullyParallel: false, // serial for video clarity; one scenario at a time
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: path.join(DOCS_DIR, 'html-report'), open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    locale: 'fr-FR',
    timezoneId: 'Africa/Casablanca',

    // Record every test — full video for docs
    video: 'on',
    screenshot: 'on',
    trace: 'retain-on-failure',

    // Viewport consistent with Mawsim's mobile-first + desktop design
    viewport: { width: 1280, height: 800 },
  },

  projects: [
    // Shared auth setup — runs first; writes .auth/ storage files used by tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Main E2E suite (depends on setup)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Tests that need auth import the right storage file
      },
      dependencies: ['setup'],
    },
  ],

  // Start the Next.js dev server automatically when running locally
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
