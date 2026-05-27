import type { BrowserContext, Cookie, Page } from '@playwright/test';
import { expect } from '@playwright/test';

// E2E auth helpers — exercised against the REAL stack with fast-mode envs
// configured in playwright.config.ts. See `auth-fast-mode.md` for env values.
//
// Test credentials are provided via E2E_USER_EMAIL and E2E_USER_PASSWORD env
// vars. If those are absent the helpers fall back to a documented dev
// fixture; the test author is responsible for ensuring that user exists in
// the local API's Postgres + Cognito.

export interface LoginOptions {
  email?: string;
  password?: string;
  rememberMe?: boolean;
  // Where the user expects to land after login. Defaults to /dashboard.
  expectedPath?: string;
}

// Falls back to the seed user from `prisma/seed.ts` (externalId
// "seed-dispatcher-external-id"). The password lives in Cognito; the test
// runner must export E2E_USER_PASSWORD before invoking the suite.
const FALLBACK_EMAIL = process.env.E2E_USER_EMAIL ?? 'dispatcher@apexdispatch.com';
const FALLBACK_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'CHANGE_ME_FOR_E2E';

/**
 * Fills the login form and submits. Resolves once the user has navigated away
 * from /login (defaults to /dashboard but accepts an override). Throws if the
 * expected redirect does not happen within the default timeout.
 */
export const login = async (page: Page, options: LoginOptions = {}): Promise<void> => {
  const email = options.email ?? FALLBACK_EMAIL;
  const password = options.password ?? FALLBACK_PASSWORD;
  // Default landing is `/` (which routes to dashboard for authenticated users).
  // Override via options.expectedPath when a specific deep-link is expected.
  const expectedPath = options.expectedPath ?? '/';

  await page.goto('/login');
  // Form fields render with `id={name}` (PasswordField/EmailField).
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  if (options.rememberMe === true) {
    await page.locator('input[name="rememberMe"]').check();
  }
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith(expectedPath), { timeout: 15000 });
};

const findCookie = (cookies: Cookie[], name: string): Cookie | undefined =>
  cookies.find((c) => c.name === name);

/**
 * Returns the refresh-token cookie's maxAge derived from its `expires` field.
 * Returns null if the cookie is missing. Useful for asserting that fast-mode
 * REFRESH_TTL_BASE_SECONDS / REFRESH_TTL_EXTENDED_SECONDS is honored.
 */
export const readRefreshCookieMaxAgeSeconds = async (
  context: BrowserContext,
): Promise<number | null> => {
  const cookies = await context.cookies();
  const refreshCookie = findCookie(cookies, 'refreshToken');
  if (!refreshCookie || refreshCookie.expires < 0) {
    return null;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.max(0, refreshCookie.expires - nowSeconds);
};

/**
 * Forces the accessToken cookie out of the browser context so the next
 * authenticated request triggers the 401 → refresh path. The refreshToken
 * cookie is left intact so refresh itself can succeed.
 */
export const forceAccessTokenExpiry = async (context: BrowserContext): Promise<void> => {
  const cookies = await context.cookies();
  const filtered = cookies.filter((c) => c.name !== 'accessToken');
  await context.clearCookies();
  if (filtered.length > 0) {
    await context.addCookies(filtered);
  }
};

/**
 * Waits for the URL to settle on /login — used to assert main-app session
 * expired routing.
 */
export const expectMainSessionExpired = async (page: Page): Promise<void> => {
  await page.waitForURL((url) => url.pathname === '/login', { timeout: 10000 });
};

/**
 * Asserts the portal session-expired screen is rendered. Confirms PortalSessionGuard
 * is wrapping the portal subtree correctly and the URL has NOT changed to /login.
 */
export const expectPortalSessionExpired = async (page: Page): Promise<void> => {
  await expect(page.getByTestId('portal-session-expired')).toBeVisible({ timeout: 10000 });
  const url = new URL(page.url());
  expect(url.pathname.startsWith('/login')).toBe(false);
};

export type RefreshStubBehavior =
  | { kind: 'unauthorized' }
  | { kind: 'network-error' }
  | { kind: 'server-error'; status?: number }
  | { kind: 'ok'; accessTokenExpiresAt?: string };

/**
 * Intercepts POST /auth/token/refresh on the page and replies according to the
 * provided behavior. Returns a counter that the test can inspect to assert
 * retry attempts.
 */
export const stubRefreshEndpoint = async (
  page: Page,
  behavior: RefreshStubBehavior,
): Promise<{ getHitCount: () => number }> => {
  let hits = 0;
  await page.route('**/auth/token/refresh', async (route) => {
    hits += 1;
    if (behavior.kind === 'network-error') {
      await route.abort('failed');
      return;
    }
    if (behavior.kind === 'unauthorized') {
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      return;
    }
    if (behavior.kind === 'server-error') {
      await route.fulfill({
        status: behavior.status ?? 503,
        contentType: 'application/json',
        body: '{}',
      });
      return;
    }
    // ok
    const expiresAt =
      behavior.accessTokenExpiresAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok', accessTokenExpiresAt: expiresAt }),
    });
  });
  return { getHitCount: () => hits };
};
