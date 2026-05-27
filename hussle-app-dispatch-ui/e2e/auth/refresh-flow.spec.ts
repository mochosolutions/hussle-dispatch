import type { APIRequestContext, APIResponse } from '@playwright/test';
import { expect, request, test } from '@playwright/test';

// Behavior validation for the 401 → refresh → retry chain and the
// rotation-grace window. Runs against the live stack with production timing
// (JWT 1h, refresh 7d, grace 10s) — does NOT require fast-mode envs.
//
// The auth rate limiter caps logins at 10/min, so this file uses describe.serial
// + a shared APIRequestContext per describe block. Across runs, wait ≥60s if
// you hit 429.

const API_BASE = 'http://localhost:3001/api/v1';

const requireCreds = (): { email: string; password: string } => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, 'E2E_USER_EMAIL + E2E_USER_PASSWORD must be set');
  return { email: email as string, password: password as string };
};

interface ParsedCookies {
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
  accessTokenMaxAge?: number;
  refreshTokenMaxAge?: number;
}

const parseSetCookieHeader = (response: APIResponse): ParsedCookies => {
  const raw = response.headers()['set-cookie'] ?? '';
  const lines = raw.split(/\n/);
  const out: ParsedCookies = {};
  for (const line of lines) {
    const [pair, ...attrs] = line.split(';').map((s) => s.trim());
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    const maxAgeAttr = attrs.find((a) => a.toLowerCase().startsWith('max-age='));
    const maxAge = maxAgeAttr ? Number(maxAgeAttr.split('=')[1]) : undefined;
    if (name === 'accessToken') {
      out.accessToken = value;
      out.accessTokenMaxAge = maxAge;
    } else if (name === 'refreshToken') {
      out.refreshToken = value;
      out.refreshTokenMaxAge = maxAge;
    } else if (name === 'csrfToken') {
      out.csrfToken = value;
    }
  }
  return out;
};

const login = async (
  ctx: APIRequestContext,
  email: string,
  password: string,
  rememberMe = false,
) => {
  const res = await ctx.post(`${API_BASE}/auth/login`, {
    data: { email, password, rememberMe },
  });
  expect(res.status()).toBe(200);
  return parseSetCookieHeader(res);
};

// =============================================================================
// Group 1 — no-credentials paths. No logins required.
// =============================================================================
test.describe('Unauthenticated paths return 401', () => {
  test('no access cookie → /auth/me returns 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API_BASE}/auth/me`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('no refresh cookie → POST /auth/token/refresh returns 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${API_BASE}/auth/token/refresh`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('garbage refresh cookie → refresh returns 400/401', async () => {
    const ctx = await request.newContext({
      storageState: {
        cookies: [
          {
            name: 'refreshToken',
            value: 'not-a-real-uuid',
            domain: 'localhost',
            path: '/',
            expires: Math.floor(Date.now() / 1000) + 3600,
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });
    const res = await ctx.post(`${API_BASE}/auth/token/refresh`);
    expect([400, 401]).toContain(res.status());
    await ctx.dispose();
  });
});

// =============================================================================
// Group 2 — happy-path rotation + retry. One login, three assertions.
// =============================================================================
test.describe.serial('Rotation chain (one login)', () => {
  let ctx: APIRequestContext;
  let initialCookies: ParsedCookies;

  test.beforeAll(async () => {
    const { email, password } = requireCreds();
    ctx = await request.newContext();
    initialCookies = await login(ctx, email, password);
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('issued login response carries new accessToken + refreshToken cookies', () => {
    expect(initialCookies.accessToken).toBeDefined();
    expect(initialCookies.refreshToken).toBeDefined();
  });

  test('/auth/me succeeds with issued cookies', async () => {
    const me = await ctx.get(`${API_BASE}/auth/me`);
    expect(me.status()).toBe(200);
    const body = (await me.json()) as { accessTokenExpiresAt?: string };
    expect(body.accessTokenExpiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('POST /auth/token/refresh rotates cookies and returns new accessTokenExpiresAt', async () => {
    const res = await ctx.post(`${API_BASE}/auth/token/refresh`);
    expect(res.status()).toBe(200);
    const rotated = parseSetCookieHeader(res);
    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(initialCookies.refreshToken);
    const body = (await res.json()) as { accessTokenExpiresAt?: string };
    expect(body.accessTokenExpiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('/auth/me still succeeds after rotation', async () => {
    const me = await ctx.get(`${API_BASE}/auth/me`);
    if (me.status() !== 200) {
      const state = await ctx.storageState();
      const access = state.cookies.find((c) => c.name === 'accessToken');
      const refresh = state.cookies.find((c) => c.name === 'refreshToken');
      // Decode the JWT header + payload to inspect.
      const decode = (token?: string): unknown => {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return { raw: token.slice(0, 60) };
        return {
          header: JSON.parse(Buffer.from(parts[0] ?? '', 'base64url').toString()),
          payload: JSON.parse(Buffer.from(parts[1] ?? '', 'base64url').toString()),
        };
      };
      throw new Error(
        `Expected 200 after rotation, got ${me.status()}: ${await me.text()}\n` +
          `accessToken in jar: ${JSON.stringify(decode(access?.value))}\n` +
          `refreshToken in jar (prefix): ${refresh?.value?.slice(0, 16) ?? 'n/a'}`,
      );
    }
  });
});

// =============================================================================
// Group 3 — read-through grace + grace expiry. Two logins (one per test).
// =============================================================================
test.describe.serial('Read-through grace window', () => {
  test('replay of OLD cookie AFTER rotation returns SAME new tokens', async () => {
    const { email, password } = requireCreds();
    const ctx = await request.newContext();
    await login(ctx, email, password);

    const stateBefore = await ctx.storageState();
    const oldRefresh = stateBefore.cookies.find((c) => c.name === 'refreshToken');
    expect(oldRefresh).toBeDefined();

    const resA = await ctx.post(`${API_BASE}/auth/token/refresh`);
    expect(resA.status()).toBe(200);
    const cookiesA = parseSetCookieHeader(resA);

    // Tab B: fresh context carrying ONLY the OLD refresh cookie.
    const ctxB = await request.newContext({
      storageState: {
        cookies: [oldRefresh as NonNullable<typeof oldRefresh>],
        origins: [],
      },
    });
    const resB = await ctxB.post(`${API_BASE}/auth/token/refresh`);
    expect(resB.status()).toBe(200);
    const cookiesB = parseSetCookieHeader(resB);

    // Grace contract: tab B replays tab A's new refresh token.
    expect(cookiesB.refreshToken).toBe(cookiesA.refreshToken);

    // Both contexts can authenticate after the replay.
    const meA = await ctx.get(`${API_BASE}/auth/me`);
    expect(meA.status()).toBe(200);
    const meB = await ctxB.get(`${API_BASE}/auth/me`);
    expect(meB.status()).toBe(200);

    await ctxB.dispose();
    await ctx.dispose();
  });

  test('replay AFTER grace window expiry returns 4xx', async () => {
    const { email, password } = requireCreds();
    const ctx = await request.newContext();
    await login(ctx, email, password);

    const stateBefore = await ctx.storageState();
    const oldRefresh = stateBefore.cookies.find((c) => c.name === 'refreshToken');

    // First rotation completes.
    const resA = await ctx.post(`${API_BASE}/auth/token/refresh`);
    expect(resA.status()).toBe(200);

    // Wait past prod ROTATION_GRACE_TTL_SECONDS=10.
    test.setTimeout(30_000);
    await new Promise((r) => setTimeout(r, 12_000));

    const ctxB = await request.newContext({
      storageState: {
        cookies: [oldRefresh as NonNullable<typeof oldRefresh>],
        origins: [],
      },
    });
    const resB = await ctxB.post(`${API_BASE}/auth/token/refresh`);
    // Either 401 (session-key gone) or 400 (validator) — the contract is
    // "definitively rejected".
    expect([400, 401]).toContain(resB.status());

    await ctxB.dispose();
    await ctx.dispose();
  });
});

// =============================================================================
// Group 4 — rememberMe TTL preservation across rotation.
// =============================================================================
test.describe('rememberMe survives rotation', () => {
  test('extended-TTL session keeps extended TTL after refresh', async () => {
    const { email, password } = requireCreds();
    const ctx = await request.newContext();
    const initial = await login(ctx, email, password, /* rememberMe */ true);
    expect(initial.refreshTokenMaxAge).toBeDefined();
    const initialMaxAge = initial.refreshTokenMaxAge ?? 0;

    const res = await ctx.post(`${API_BASE}/auth/token/refresh`);
    expect(res.status()).toBe(200);
    const rotated = parseSetCookieHeader(res);
    const newMaxAge = rotated.refreshTokenMaxAge ?? 0;

    // New Max-Age should be within 95% of original (allowing seconds drift).
    expect(newMaxAge).toBeGreaterThanOrEqual(Math.floor(initialMaxAge * 0.95));

    await ctx.dispose();
  });
});
