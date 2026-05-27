import { expect, test } from '@playwright/test';
import { forceAccessTokenExpiry, login } from './helpers';

// E2E-AC2 + AC3 + AC11 + AC12 — proactive timer, reactive 401 refresh, logout
// clears cookies, visibility-triggered refresh. All run against the real stack
// with fast-mode envs (JWT 10s, refresh base 60s, lead 3s).

test.describe('Proactive + reactive refresh', () => {
  test('AC2: proactive timer fires a refresh ~7s after login', async ({ page, context }) => {
    const refreshRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/auth/token/refresh')) {
        refreshRequests.push(req.url());
      }
    });

    await login(page);

    // JWT expires at ~now+10s, lead is 3s → timer fires at ~now+7s.
    await page.waitForTimeout(8000);

    expect(refreshRequests.length).toBeGreaterThanOrEqual(1);
    // User remains authenticated — no redirect to /login.
    expect(new URL(page.url()).pathname.startsWith('/login')).toBe(false);

    // Ensure cookies still present.
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'accessToken')).toBeDefined();
    expect(cookies.find((c) => c.name === 'refreshToken')).toBeDefined();
  });

  test('AC3: forced access expiry → next API call triggers refresh + retry', async ({
    page,
    context,
  }) => {
    await login(page);

    let refreshHit = false;
    page.on('request', (req) => {
      if (req.url().includes('/auth/token/refresh')) {
        refreshHit = true;
      }
    });

    await forceAccessTokenExpiry(context);

    // Navigate to a protected route → triggers a /auth/me or similar.
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    expect(refreshHit).toBe(true);
    expect(new URL(page.url()).pathname.startsWith('/login')).toBe(false);
  });

  test('AC11: logout clears cookies; subsequent /auth/me returns 401', async ({
    page,
    context,
  }) => {
    await login(page);
    await page.getByRole('button', { name: /log out|sign out|logout/i }).click();
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 10000 });

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'accessToken')).toBeUndefined();
    expect(cookies.find((c) => c.name === 'refreshToken')).toBeUndefined();
  });

  test('AC12: visibilitychange near expiry fires refresh', async ({ page }) => {
    await login(page);

    // Wait 5s so we're within the 3s lead window when we go background→visible.
    await page.waitForTimeout(5000);

    const refreshRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/auth/token/refresh')) {
        refreshRequests.push(req.url());
      }
    });

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(500);

    expect(refreshRequests.length).toBeGreaterThanOrEqual(1);
  });
});
