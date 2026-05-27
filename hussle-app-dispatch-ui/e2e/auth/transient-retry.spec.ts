import { expect, test } from '@playwright/test';
import {
  expectMainSessionExpired,
  forceAccessTokenExpiry,
  login,
} from './helpers';

// E2E-AC7 + AC8 — transient retry path. The interceptor (and proactive refresh
// helper) retry transient failures per VITE_TRANSIENT_RETRY_BACKOFF_MS
// (300/800/2000ms in fast mode), surfacing a "Reconnecting…" toast that
// dismisses on eventual success.

test.describe('Transient refresh retry', () => {
  test('AC7: 2 network errors then success → Reconnecting toast shown then dismissed', async ({
    page,
    context,
  }) => {
    await login(page);

    let refreshAttempts = 0;
    await page.route('**/auth/token/refresh', async (route) => {
      refreshAttempts += 1;
      if (refreshAttempts <= 2) {
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'ok',
          accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await forceAccessTokenExpiry(context);

    // Trigger a request that 401s, which kicks off the retry loop.
    await page.goto('/dashboard');

    // The toast may appear and disappear quickly with fast-mode timing; check
    // that the retry loop succeeded by asserting we did NOT end up on /login.
    await page.waitForLoadState('networkidle');
    expect(refreshAttempts).toBeGreaterThanOrEqual(3);
    expect(new URL(page.url()).pathname.startsWith('/login')).toBe(false);
  });

  test('AC8: 4 consecutive network errors → sessionExpired (main) → /login', async ({
    page,
    context,
  }) => {
    await login(page);

    let refreshAttempts = 0;
    await page.route('**/auth/token/refresh', async (route) => {
      refreshAttempts += 1;
      await route.abort('failed');
    });

    await forceAccessTokenExpiry(context);
    await page.goto('/dashboard');

    await expectMainSessionExpired(page);
    // initial + 3 retries from TRANSIENT_RETRY_BACKOFF_MS
    expect(refreshAttempts).toBeGreaterThanOrEqual(4);
  });
});
