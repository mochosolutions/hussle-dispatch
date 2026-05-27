import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '@/shared/errors/commonErrors';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  setCsrfTokenCookie,
} from '@/shared/utils/cookieUtils';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Paths exempt from CSRF validation. Either:
 *  - Public endpoints (no session cookie exists yet — login, signup, refresh,
 *    forgot/reset password, invite accept). These mint a session, so blocking
 *    them on a token they can't yet have would be circular.
 *  - Webhooks (`/webhooks/*`) which carry an HMAC signature instead and are
 *    invoked by external systems that don't run our JS.
 */
const EXEMPT_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/signup',
  '/api/v1/auth/password/reset',
  '/api/v1/auth/token/refresh',
  '/api/v1/auth/invitations',
  '/webhooks/',
];

const isExemptPath = (url: string): boolean =>
  EXEMPT_PREFIXES.some((prefix) => url.startsWith(prefix));

/**
 * Double-submit-cookie CSRF protection for session-cookie authenticated
 * requests. The csrfToken cookie is JS-readable (set by setCsrfTokenCookie at
 * login/refresh, or lazily here on the first authenticated GET). The SPA
 * mirrors its value into the X-CSRF-Token header on every mutating request.
 *
 * Bearer-token requests (extension / API key) carry no session cookie and are
 * therefore not CSRF-attackable through the browser — we let them through.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  if (isExemptPath(req.path)) {
    next();
    return;
  }

  const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
  const hasSessionCookie = Boolean(cookies['accessToken']);

  if (!hasSessionCookie) {
    // No session cookie → either unauthenticated or Bearer-authed (extension /
    // API key). Auth middleware downstream still gates access; CSRF doesn't
    // apply.
    next();
    return;
  }

  const existingCsrf = cookies[CSRF_COOKIE_NAME];

  if (SAFE_METHODS.has(req.method)) {
    // Lazily mint a CSRF token for sessions that pre-date this middleware so
    // the SPA always has one to forward on the next mutation.
    if (existingCsrf === undefined || existingCsrf.length === 0) {
      setCsrfTokenCookie(res, generateCsrfToken());
    }
    next();
    return;
  }

  const headerValue = req.headers[CSRF_HEADER_NAME];
  const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (
    existingCsrf === undefined ||
    existingCsrf.length === 0 ||
    typeof headerToken !== 'string' ||
    headerToken.length === 0 ||
    headerToken !== existingCsrf
  ) {
    throw new ForbiddenError('CSRF token missing or invalid.');
  }

  next();
};
