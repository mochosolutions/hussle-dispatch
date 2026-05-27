import { Router } from 'express';
import type { RequestHandler } from 'express';
import { appAuth } from '../../shared/middleware/authenticateUser';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { feedQueryValidator } from '../validators/feedQueryValidator';
import {
  storeMarketDataValidator,
  getMarketDataValidator,
} from '../validators/marketDataValidator';
import { backhaulQueryValidator, chainQueryValidator } from '../validators/backhaulValidator';
import {
  bookLoadParamValidator,
  manualLoadIntelValidator,
  ingestSingleValidator,
  ingestBatchValidator,
} from '../validators/bookValidator';

export interface LoadIntelControllers {
  getFeed: RequestHandler;
  getLoadById: RequestHandler;
  dismissLoad: RequestHandler;
  storeMarketData: RequestHandler;
  getMarketData: RequestHandler;
  searchBackhaul: RequestHandler;
  getChains: RequestHandler;
  bookLoad: RequestHandler;
  bookChain: RequestHandler;
  manualIngest: RequestHandler;
  ingestSingle: RequestHandler;
  ingestBatch: RequestHandler;
}

export const loadIntelRoutes = (controllers: LoadIntelControllers): Router => {
  const router = Router();

  // GET /feed — paginated feed with filters
  router.get(
    '/feed',
    appAuth,
    validateRequest(feedQueryValidator),
    controllers.getFeed,
  );

  // GET /backhaul — search for backhaul loads
  router.get(
    '/backhaul',
    appAuth,
    validateRequest(backhaulQueryValidator),
    controllers.searchBackhaul,
  );

  // GET /market-data/:state/:city — current market strength
  router.get(
    '/market-data/:state/:city',
    appAuth,
    validateRequest(getMarketDataValidator),
    controllers.getMarketData,
  );

  // POST /manual — simplified manual entry
  router.post(
    '/manual',
    appAuth,
    validateRequest(manualLoadIntelValidator),
    controllers.manualIngest,
  );

  // POST /ingest — single LoadIntelPayload ingestion
  router.post(
    '/ingest',
    appAuth,
    validateRequest(ingestSingleValidator),
    controllers.ingestSingle,
  );

  // POST /ingest/batch — array of LoadIntelPayloads
  router.post(
    '/ingest/batch',
    appAuth,
    validateRequest(ingestBatchValidator),
    controllers.ingestBatch,
  );

  // POST /market-data — store market snapshot
  router.post(
    '/market-data',
    appAuth,
    validateRequest(storeMarketDataValidator),
    controllers.storeMarketData,
  );

  // POST /:id/book — read load from Redis, return pre-fill data
  router.post(
    '/:id/book',
    appAuth,
    validateRequest(bookLoadParamValidator),
    controllers.bookLoad,
  );

  // POST /:id/book-chain — read outbound + chain from Redis
  router.post(
    '/:id/book-chain',
    appAuth,
    validateRequest(bookLoadParamValidator),
    controllers.bookChain,
  );

  // GET /:id/chains — assemble chains for a load
  router.get(
    '/:id/chains',
    appAuth,
    validateRequest(chainQueryValidator),
    controllers.getChains,
  );

  // GET /:id — single load with full scores
  router.get(
    '/:id',
    appAuth,
    controllers.getLoadById,
  );

  // DELETE /:id — dismiss a load
  router.delete(
    '/:id',
    appAuth,
    controllers.dismissLoad,
  );

  return router;
};
