import { expect, test } from '@playwright/test';

// Backend-fix smoke: prove that /auth/login and /auth/me return
// `accessTokenExpiresAt` (ISO 8601). No fast-mode required — uses whatever
// timing the running API is configured with.

test('login + /auth/me both return accessTokenExpiresAt as ISO 8601', async ({ request }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, 'E2E_USER_EMAIL + E2E_USER_PASSWORD must be set');

  // Login (rememberMe false → base TTL session)
  const loginRes = await request.post('http://localhost:3001/api/v1/auth/login', {
    data: { email, password, rememberMe: false },
  });
  expect(loginRes.status()).toBe(200);

  const loginBody = (await loginRes.json()) as {
    status: string;
    accessTokenExpiresAt?: string;
    user?: { id: string };
  };

  expect(loginBody.status).toBe('authenticated');
  expect(loginBody.accessTokenExpiresAt).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
  );

  // /auth/me with the issued cookies (request context auto-stores them)
  const meRes = await request.get('http://localhost:3001/api/v1/auth/me');
  expect(meRes.status()).toBe(200);
  const meBody = (await meRes.json()) as { accessTokenExpiresAt?: string };
  expect(meBody.accessTokenExpiresAt).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
  );

  // /auth/token/refresh also includes accessTokenExpiresAt
  const refreshRes = await request.post('http://localhost:3001/api/v1/auth/token/refresh');
  expect(refreshRes.status()).toBe(200);
  const refreshBody = (await refreshRes.json()) as { accessTokenExpiresAt?: string };
  expect(refreshBody.accessTokenExpiresAt).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
  );
});

test('rememberMe round-trips: extended cookie maxAge when rememberMe=true', async ({
  request,
}) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, 'E2E_USER_EMAIL + E2E_USER_PASSWORD must be set');

  // Login without rememberMe — read refreshToken cookie expiry
  const baseRes = await request.post('http://localhost:3001/api/v1/auth/login', {
    data: { email, password, rememberMe: false },
  });
  expect(baseRes.status()).toBe(200);
  const baseCookies = baseRes
    .headers()
    ['set-cookie']?.split(/\n/)
    .find((c) => c.startsWith('refreshToken='));
  expect(baseCookies).toBeDefined();

  // Login with rememberMe — refreshToken cookie should have a longer Max-Age
  const extRes = await request.post('http://localhost:3001/api/v1/auth/login', {
    data: { email, password, rememberMe: true },
  });
  expect(extRes.status()).toBe(200);
  const extCookies = extRes
    .headers()
    ['set-cookie']?.split(/\n/)
    .find((c) => c.startsWith('refreshToken='));
  expect(extCookies).toBeDefined();

  const extractMaxAge = (cookieLine: string): number | null => {
    const match = /Max-Age=(\d+)/i.exec(cookieLine);
    return match?.[1] ? Number(match[1]) : null;
  };

  const baseMaxAge = extractMaxAge(baseCookies ?? '');
  const extMaxAge = extractMaxAge(extCookies ?? '');

  expect(baseMaxAge).not.toBeNull();
  expect(extMaxAge).not.toBeNull();
  // Extended TTL must be strictly greater than base TTL.
  expect((extMaxAge ?? 0) > (baseMaxAge ?? 0)).toBe(true);
});
