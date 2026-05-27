import { expect, test } from '@playwright/test';
import {
  expectMainSessionExpired,
  expectPortalSessionExpired,
  forceAccessTokenExpiry,
  login,
  stubRefreshEndpoint,
} from './helpers';

// E2E-AC5 + AC6 — definitive refresh failure routing differs by context.

test.describe('Refresh failure routing', () => {
  test('AC5: refresh 401 on /dashboard → user lands on /login', async ({ page, context }) => {
    await login(page);
    await stubRefreshEndpoint(page, { kind: 'unauthorized' });
    await forceAccessTokenExpiry(context);

    await page.goto('/dashboard');
    await expectMainSessionExpired(page);
  });

  test('AC6: refresh 401 inside /carrier-portal → SessionExpiredPortalScreen rendered, URL stays on portal', async ({
    page,
    context,
  }) => {
    // Land on a portal URL directly. The portal accepts invite-token sessions,
    // but for this test we just need the URL to be classified as 'portal' by
    // the axios interceptor — even an unauthenticated GET will route through
    // the same interceptor when its session expires.
    //
    // We log in to establish session cookies (so the interceptor's refresh
    // attempt is meaningful), then visit a portal URL.
    await login(page);
    await page.goto('/carrier-portal/dashboard');

    await stubRefreshEndpoint(page, { kind: 'unauthorized' });
    await forceAccessTokenExpiry(context);

    // Trigger a request from the portal context.
    await page.evaluate(() =>
      fetch('/api/v1/carrier-portal/me', { credentials: 'include' }).catch(() => undefined),
    );

    await expectPortalSessionExpired(page);
  });
});
