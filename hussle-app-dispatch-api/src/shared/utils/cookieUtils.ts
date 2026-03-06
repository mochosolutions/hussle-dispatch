import type { Response } from 'express';

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

export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  setCookie(res, {
    name: 'refreshToken',
    value: refreshToken,
    options: {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken', { httpOnly: true });
  res.clearCookie('refreshToken', { httpOnly: true });
};
