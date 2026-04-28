import express, { Router } from 'express';
import { appAuth } from '../../shared/middleware/authenticateUser';
import { sessionOrApiKeyAuth } from '../../shared/middleware/sessionOrApiKeyAuth';
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  ingestValidator,
  getFeedValidator,
  getLoadDetailValidator,
  clearSourceValidator,
} from '../validators/loadBoardValidators';
import type { LoadBoardControllers } from '../controllers/loadBoardControllers';

export const loadBoardRoutes = (controllers: LoadBoardControllers): Router => {
  const router = Router();

  // POST /ingest — ingest loads from extension or UI (supports session or API key)
  router.post(
    '/ingest',
    sessionOrApiKeyAuth,
    express.json({ limit: '1mb' }),
    validateRequest(ingestValidator),
    controllers.ingest,
  );

  // GET /ping — auth check for extension (supports session or API key)
  // Must be defined BEFORE /feed/:id to avoid route shadowing.
  router.get('/ping', sessionOrApiKeyAuth, controllers.ping);

  // GET /feed — all staged loads for org
  router.get(
    '/feed',
    appAuth,
    validateRequest(getFeedValidator),
    controllers.getFeed,
  );

  // GET /feed/:id — single load detail
  router.get(
    '/feed/:id',
    appAuth,
    validateRequest(getLoadDetailValidator),
    controllers.getLoadDetail,
  );

  // DELETE /feed/:source — clear all loads for a source
  router.delete(
    '/feed/:source',
    appAuth,
    validateRequest(clearSourceValidator),
    controllers.clearSource,
  );

  return router;
};
