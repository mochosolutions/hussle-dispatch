import crypto from 'node:crypto';

import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { Logger } from '@/shared/utils/logger';

import './express.d';

interface VerifyDocusealHmacDeps {
  secret: string;
  logger: Logger;
}

/**
 * Express middleware that verifies the `X-Docuseal-Signature` HMAC-SHA256
 * header against the raw request body using `crypto.timingSafeEqual` to avoid
 * timing-based signature recovery attacks.
 *
 * Preconditions:
 * - The route MUST mount `express.raw({ type: 'application/json' })` and a tiny
 *   shuffler that copies the captured Buffer to `req.rawBody` BEFORE this
 *   middleware runs.
 *
 * On success, parses the verified raw body as JSON and reassigns it to
 * `req.body` so downstream controllers see a typed object.
 */
export const createVerifyDocusealHmac = (deps: VerifyDocusealHmacDeps): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!deps.secret) {
      deps.logger.error('DocuSeal webhook secret not configured');
      res.status(500).json({ errors: [{ message: 'webhook misconfigured' }] });
      return;
    }

    const signature = req.header('X-Docuseal-Signature');
    if (!signature) {
      res.status(401).json({ errors: [{ message: 'missing signature' }] });
      return;
    }

    if (!req.rawBody) {
      deps.logger.error('rawBody not attached — raw body parser missing on this route');
      res.status(500).json({ errors: [{ message: 'rawBody missing' }] });
      return;
    }

    const expected = crypto
      .createHmac('sha256', deps.secret)
      .update(req.rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    let providedBuf: Buffer;
    try {
      providedBuf = Buffer.from(signature, 'hex');
    } catch {
      deps.logger.warn('DocuSeal HMAC signature is not valid hex', { signature });
      res.status(401).json({ errors: [{ message: 'invalid signature' }] });
      return;
    }

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      deps.logger.warn('DocuSeal HMAC mismatch', { signature });
      res.status(401).json({ errors: [{ message: 'invalid signature' }] });
      return;
    }

    try {
      req.body = JSON.parse(req.rawBody.toString('utf8'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';
      deps.logger.warn('DocuSeal webhook body is not valid JSON', { message });
      res.status(400).json({ errors: [{ message: 'invalid json' }] });
      return;
    }

    next();
  };
