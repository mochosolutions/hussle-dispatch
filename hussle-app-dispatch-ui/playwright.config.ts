import { defineConfig, devices } from '@playwright/test';

// Fast-mode env overrides — compresses the full token lifecycle from days to
// seconds so E2E auth tests can exercise proactive refresh, grace-window
// replay, and TTL expiry within a single suite run. See
// `hussle-app-dispatch-api/docs/auth-fast-mode.md` for the source of truth on
// these values. Locally, dev servers are reused (reuseExistingServer: true) and
// the developer must export these envs themselves; in CI, Playwright spawns
// fresh processes and these envs apply at boot.
const FAST_MODE_API_ENV = {
  JWT_EXPIRES_IN: '10s',
  REFRESH_TTL_BASE_SECONDS: '60',
  REFRESH_TTL_EXTENDED_SECONDS: '180',
  ROTATION_GRACE_TTL_SECONDS: '5',
} as const;

const FAST_MODE_UI_ENV = {
  VITE_API_URL: 'http://localhost:3001',
  VITE_PROACTIVE_REFRESH_LEAD_MS: '3000',
  VITE_TRANSIENT_RETRY_BACKOFF_MS: '300,800,2000',
} as const;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e-results',
  // auth tests share cookies + a single Redis instance; serialize across the
  // suite to avoid cross-test interference on session keys.
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone SE'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev --prefix ../hussle-app-dispatch-api',
      url: 'http://localhost:3001/api/health',
      env: { ...FAST_MODE_API_ENV },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      env: { ...FAST_MODE_UI_ENV },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
