import type { Response } from 'express';
import type { ContentDisposition, StorageProvider } from './storageProvider';

export interface StreamFileResponseInput {
  res: Response;
  storageProvider: StorageProvider;
  key: string;
  displayName?: string;
  disposition?: ContentDisposition;
  expiresInSeconds?: number;
}

/**
 * Resolves a storage key to a short-lived download URL and 302-redirects the
 * response there. Use inside per-entity download controllers AFTER the entity
 * has been fetched + scope-checked by organizationId — this helper performs no
 * authorization of its own.
 *
 * Both backends behave the same shape (provider returns a URL, we redirect):
 *   - local: URL points at /api/v1/storage/<key> (auth-gated by appAuth)
 *   - s3:    URL is a short-lived presigned S3 GET
 *
 * Cache-Control: no-store prevents intermediate caches from holding the
 * redirect target after it expires (S3) or after permissions change.
 */
export const streamFileResponse = async (input: StreamFileResponseInput): Promise<void> => {
  const url = await input.storageProvider.getPresignedGetUrl(
    input.key,
    input.expiresInSeconds,
    input.displayName,
    input.disposition ?? 'attachment',
  );
  input.res.setHeader('Cache-Control', 'no-store');
  input.res.redirect(302, url);
};
