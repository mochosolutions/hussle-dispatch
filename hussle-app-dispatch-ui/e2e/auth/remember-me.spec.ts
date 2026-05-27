import { expect, test } from '@playwright/test';
import { login, readRefreshCookieMaxAgeSeconds } from './helpers';

// E2E-AC9 + AC10 — Remember Me toggles refresh-token TTL between base (60s
// fast mode) and extended (180s fast mode). These are the longest tests in
// the suite (~70s each); tagged so CI runs can opt out if needed.

test.describe('Remember Me TTL', () => {
  test.describe.configure({ timeout: 120_000 });

  test('AC9 @slow: rememberMe checked → 180s session survives past 60s base TTL', async ({
    page,
    context,
  }) => {
    await login(page, { rememberMe: true });

    const ttl = await readRefreshCookieMaxAgeSeconds(context);
    // Tolerate ±5s clock skew vs the 180s extended TTL.
    expect(ttl).not.toBeNull();
    expect(ttl ?? 0).toBeGreaterThanOrEqual(170);
    expect(ttl ?? 0).toBeLessThanOrEqual(185);

    // Wait past the base TTL (60s) but within the extended (180s).
    await page.waitForTimeout(65_000);

    // Navigate to a protected route — should still succeed via grace + rotation.
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname.startsWith('/login')).toBe(false);
  });

  test('AC10 @slow: rememberMe unchecked → 60s session expires at base TTL', async ({
    page,
    context,
  }) => {
    await login(page, { rememberMe: false });

    const ttl = await readRefreshCookieMaxAgeSeconds(context);
    expect(ttl).not.toBeNull();
    expect(ttl ?? 0).toBeGreaterThanOrEqual(50);
    expect(ttl ?? 0).toBeLessThanOrEqual(65);

    // Wait past the base TTL.
    await page.waitForTimeout(65_000);

    // Navigate — should be punted to /login since both cookie + Redis are gone.
    await page.goto('/dashboard');
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 15_000 });
  });
});
