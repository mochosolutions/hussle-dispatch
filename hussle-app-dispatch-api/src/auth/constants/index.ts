export const REFRESH_TTL_BASE_SECONDS =
  Number(process.env['REFRESH_TTL_BASE_SECONDS']) || 7 * 24 * 60 * 60;

export const REFRESH_TTL_EXTENDED_SECONDS =
  Number(process.env['REFRESH_TTL_EXTENDED_SECONDS']) || 30 * 24 * 60 * 60;

export const ROTATION_GRACE_TTL_SECONDS =
  Number(process.env['ROTATION_GRACE_TTL_SECONDS']) || 10;

import type { SignOptions } from 'jsonwebtoken';

// jsonwebtoken's SignOptions['expiresIn'] uses a template-literal `${number}<unit>`
// type. Env vars arrive as plain `string`, so we narrow via a runtime check and
// fall back to a known-good literal.
const parseJwtExpiresIn = (raw: string | undefined): SignOptions['expiresIn'] => {
  if (!raw) {
    return '1h';
  }
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    return asNumber;
  }
  // Pattern match unit-suffixed strings the library accepts.
  if (/^\d+(ms|s|m|h|d|w|y)$/.test(raw)) {
    return raw as SignOptions['expiresIn'];
  }
  return '1h';
};

export const JWT_EXPIRES_IN: SignOptions['expiresIn'] = parseJwtExpiresIn(
  process.env['JWT_EXPIRES_IN']
);

// Backward-compat alias for legacy imports. New code should prefer
// REFRESH_TTL_BASE_SECONDS or getRefreshTtlSeconds(rememberMe).
export const REFRESH_TTL_SECONDS = REFRESH_TTL_BASE_SECONDS;

export const getRefreshTtlSeconds = (rememberMe: boolean): number =>
  rememberMe ? REFRESH_TTL_EXTENDED_SECONDS : REFRESH_TTL_BASE_SECONDS;

export const getJwtSecret = (): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};
