import crypto from 'crypto';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';
import { getJwtSecret, JWT_EXPIRES_IN } from '../../constants';

// REFRESH_SECRET is required — startup validation in localserver.ts ensures it is set.
// No fallback: a known fallback would allow token forgery if the env var is missing.
const getRefreshSecret = (): string => {
  const secret = process.env['REFRESH_SECRET'];
  if (!secret) {
    throw new Error('REFRESH_SECRET environment variable is not set');
  }
  return secret;
};

// Generate App Access Token (JWT)
export const generateAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });

export const hashToken = (token: string): string =>
  crypto.createHmac('sha256', getRefreshSecret()).update(token).digest('hex');

export const verifyToken = (token: string, hashed: string): boolean => {
  const expected = hashToken(token);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hashed));
};

export const extractAccessTokenExpAsIso = (token: string): string => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new Error('access token missing exp claim');
  }
  return new Date(decoded.exp * 1000).toISOString();
};
