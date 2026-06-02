import { expect, test } from '@playwright/test';

// Smoke test: confirms Playwright + dev server + driver portal route are wired up.
// Mocks the load-summary API to a 401 (no driver session) so the test is
// deterministic without requiring the backend to be running. Portal reads now
// require a driver session — a 401 surfaces the "Sign In Required" screen.
test.describe('Driver portal smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Missing authentication token' }] }),
      });
    });
  });

  test('renders Sign In Required state when there is no driver session', async ({ page }) => {
    await page.goto('/driver-portal/invalid-token-12345');

    await expect(page.getByRole('heading', { name: 'Sign In Required' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    await page.screenshot({
      path: 'e2e-results/screenshots/driver-portal-smoke.png',
      fullPage: true,
    });
  });
});
