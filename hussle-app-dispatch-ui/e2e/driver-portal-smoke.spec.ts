import { expect, test } from '@playwright/test';

// Smoke test: confirms Playwright + dev server + driver portal route are wired up.
// Mocks the load-summary API to a 401 invalid-token response so the test is
// deterministic without requiring the backend to be running.
test.describe('Driver portal smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Invalid token' }] }),
      });
    });
  });

  test('renders Invalid Link state for an unrecognised token', async ({ page }) => {
    await page.goto('/driver-portal/invalid-token-12345');

    await expect(page.getByRole('heading', { name: 'Invalid Link' })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: 'e2e-results/screenshots/driver-portal-smoke.png',
      fullPage: true,
    });
  });
});
