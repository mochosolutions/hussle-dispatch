import express from 'express';
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express';

import './express.d';

interface DocusealWebhookRouterDeps {
  controller: RequestHandler;
  verifyHmac: RequestHandler;
}

/**
 * Mounts POST /docuseal with the raw-body capture chain required for HMAC
 * verification:
 *
 *   1. `express.raw` writes the request bytes to `req.body` as a Buffer.
 *   2. The shuffler copies that Buffer to `req.rawBody` so the HMAC middleware
 *      can find it. The shuffler does NOT use `as any` — `req.rawBody` is
 *      typed via the Request augmentation in `./express.d.ts`.
 *   3. `verifyHmac` checks the signature, then reassigns `req.body` to the
 *      parsed JSON.
 *   4. `controller` reads `req.body` as the parsed payload.
 */
export const createDocusealWebhookRouter = (
  deps: DocusealWebhookRouterDeps,
): Router => {
  const router = express.Router();

  const shuffleRawBody = (req: Request, _res: Response, next: NextFunction): void => {
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body;
    }
    next();
  };

  router.post(
    '/docuseal',
    express.raw({ type: 'application/json', limit: '2mb' }),
    shuffleRawBody,
    deps.verifyHmac,
    deps.controller,
  );

  return router;
};
