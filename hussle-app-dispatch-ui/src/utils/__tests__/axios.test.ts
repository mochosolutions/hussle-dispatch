// Unit-level coverage of the pure auth-interceptor helpers. End-to-end
// behavior (retry → schedule → sessionExpired → routing) is verified by the
// Playwright suite in e2e/auth/ — this file proves only the classification
// rules that the suite alone cannot lock down deterministically.
//
// The interceptor module itself (utils/axios.ts) can't be loaded by jest
// because the project's __mocks__/axios.ts auto-mock and axios's package
// exports break under ts-jest's CommonJS resolver. See US-04 E2E specs for
// the full wiring assertion.
import {
  classifyContext,
  classifyRefreshFailure,
} from '../authInterceptorHelpers';
import { SessionExpiredContext } from 'features/auth/types';

describe('classifyContext', () => {
  it('returns PORTAL for /carrier-portal URLs', () => {
    expect(classifyContext('/carrier-portal/loads')).toBe(SessionExpiredContext.PORTAL);
    expect(classifyContext('/api/v1/carrier-portal/me')).toBe(SessionExpiredContext.PORTAL);
  });

  it('returns PORTAL for /driver-portal URLs', () => {
    expect(classifyContext('/driver-portal/dashboard')).toBe(SessionExpiredContext.PORTAL);
  });

  it('returns MAIN for non-portal URLs', () => {
    expect(classifyContext('/loads')).toBe(SessionExpiredContext.MAIN);
    expect(classifyContext('/api/v1/carriers')).toBe(SessionExpiredContext.MAIN);
  });

  it('returns MAIN when url is undefined', () => {
    expect(classifyContext(undefined)).toBe(SessionExpiredContext.MAIN);
  });

  it('does NOT match substring collisions (e.g., portal embedded in random path)', () => {
    // Sanity check: "/loads/portal" would still match the "/carrier-portal"
    // pattern only if it contained that exact substring. We require the
    // segment string itself.
    expect(classifyContext('/notes-on-portal-strategy')).toBe(SessionExpiredContext.MAIN);
  });
});

describe('classifyRefreshFailure', () => {
  it('treats 401 as auth-failure (no retry, immediate sessionExpired)', () => {
    expect(classifyRefreshFailure(401)).toBe('auth-failure');
  });

  it('treats 403 as auth-failure', () => {
    expect(classifyRefreshFailure(403)).toBe('auth-failure');
  });

  it('treats network errors (undefined status) as transient (retry)', () => {
    expect(classifyRefreshFailure(undefined)).toBe('transient');
  });

  it('treats 5xx as transient (retry)', () => {
    expect(classifyRefreshFailure(500)).toBe('transient');
    expect(classifyRefreshFailure(502)).toBe('transient');
    expect(classifyRefreshFailure(503)).toBe('transient');
    expect(classifyRefreshFailure(599)).toBe('transient');
  });

  it('treats other 4xx as terminal (no retry, no sessionExpired)', () => {
    expect(classifyRefreshFailure(400)).toBe('terminal');
    expect(classifyRefreshFailure(404)).toBe('terminal');
    expect(classifyRefreshFailure(429)).toBe('terminal');
  });

  it('treats 200/201 as terminal (not retryable — caller should not reach here)', () => {
    expect(classifyRefreshFailure(200)).toBe('terminal');
  });
});
