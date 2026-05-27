import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { REFRESH_TTL_BASE_SECONDS } from '../../auth/constants';

export const CSRF_COOKIE_NAME = 'csrfToken';
export const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_BYTES = 32;

export const generateCsrfToken = (): string =>
  randomBytes(CSRF_TOKEN_BYTES).toString('base64url');

interface SetCookieInput {
  name: string;
  value: string;
  options?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  };
}

const setCookie = (res: Response, input: SetCookieInput): void => {
  const { name, value, options = {} } = input;
  res.cookie(name, value, {
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? process.env['NODE_ENV'] === 'production',
    sameSite: options.sameSite ?? (process.env['NODE_ENV'] === 'production' ? 'none' : 'lax'),
    maxAge: options.maxAge ?? 24 * 60 * 60 * 1000,
  });
};

export const setAccessTokenCookie = (res: Response, accessToken: string): void => {
  setCookie(res, {
    name: 'accessToken',
    value: accessToken,
    options: {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax',
      maxAge: 60 * 60 * 1000,
    },
  });
};

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string,
  maxAgeMs?: number
): void => {
  setCookie(res, {
    name: 'refreshToken',
    value: refreshToken,
    options: {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax',
      maxAge: maxAgeMs ?? REFRESH_TTL_BASE_SECONDS * 1000,
    },
  });
};

/**
 * Sets the CSRF double-submit cookie. Unlike the access/refresh cookies this
 * is intentionally NOT HttpOnly — the SPA reads it via document.cookie and
 * mirrors the value into the X-CSRF-Token header on mutating requests, so the
 * server can confirm the request came from same-origin JS.
 */
export const setCsrfTokenCookie = (res: Response, csrfToken: string): void => {
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken', { httpOnly: true });
  res.clearCookie('refreshToken', { httpOnly: true });
  res.clearCookie(CSRF_COOKIE_NAME, { httpOnly: false, path: '/' });
};
