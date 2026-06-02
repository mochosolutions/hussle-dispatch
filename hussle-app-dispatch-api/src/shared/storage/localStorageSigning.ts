import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Local-storage presigned-URL signing.
 *
 * The S3 backend produces self-authorizing presigned URLs — the signature in
 * the URL is what grants access, so an unauthenticated client (e.g. a magic-link
 * portal) can PUT/GET directly. The dev local backend serves files through an
 * Express route, so it needs the same property: a short-lived HMAC signature
 * embedded in the URL that the route can verify without a session.
 */

const DEFAULT_TTL_SECONDS = 15 * 60;

const computeSignature = (secret: string, key: string, expiresAt: number): string =>
  createHmac('sha256', secret).update(`${key}:${String(expiresAt)}`).digest('hex');

export const buildSignedStorageQuery = (
  secret: string,
  key: string,
  expiresInSeconds: number = DEFAULT_TTL_SECONDS,
): { exp: number; sig: string } => {
  const exp = Date.now() + expiresInSeconds * 1000;
  return { exp, sig: computeSignature(secret, key, exp) };
};

export const verifyStorageSignature = (
  secret: string,
  key: string,
  query: { exp: string | undefined; sig: string | undefined },
): boolean => {
  const { exp, sig } = query;
  if (exp === undefined || sig === undefined) {
    return false;
  }
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }
  const expected = computeSignature(secret, key, expiresAt);
  const provided = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  return provided.length === expectedBuf.length && timingSafeEqual(provided, expectedBuf);
};
