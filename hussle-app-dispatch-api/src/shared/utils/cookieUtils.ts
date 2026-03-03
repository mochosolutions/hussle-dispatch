import type { Response } from 'express';

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  } = {},
): void => {
  res.cookie(name, value, {
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? process.env['NODE_ENV'] === 'production',
    sameSite: options.sameSite ?? (process.env['NODE_ENV'] === 'production' ? 'none' : 'lax'),
    maxAge: options.maxAge ?? 24 * 60 * 60 * 1000,
  });
};

export const setAccessTokenCookie = (res: Response, accessToken: string): void => {
  setCookie(res, 'accessToken', accessToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax',
    maxAge: 60 * 60 * 1000,
  });
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  setCookie(res, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken', { httpOnly: true });
  res.clearCookie('refreshToken', { httpOnly: true });
};
