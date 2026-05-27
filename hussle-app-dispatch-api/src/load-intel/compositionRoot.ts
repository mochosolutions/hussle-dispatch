import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { EventBus } from '../shared/messaging/eventBus';
import type { Logger } from '../shared/utils/logger';
import { createLoadIntelRedisAdapter } from './adapters/loadIntelRedisAdapter';
import { createFleetQueryAdapter } from './adapters/fleetQueryAdapter';
import { createMarketDataAdapter } from './adapters/marketDataAdapter';
import { createBackhaulGeoAdapter } from './adapters/backhaulGeoAdapter';
import { ingest, ingestBatch } from './services/loadIntelService';
import { getFeed, getLoadById, dismissLoad } from './services/loadIntelFeedService';
import { storeMarketSnapshot, getMarketSnapshot } from './services/marketDataService';
import { searchBackhaul } from './services/backhaulService';
import { assembleChain } from './services/chainService';
import { bookLoad, bookChain } from './services/bookService';
import { getFeedController } from './controllers/getFeedController';
import { getLoadByIdController } from './controllers/getLoadByIdController';
import { dismissLoadController } from './controllers/dismissLoadController';
import { storeMarketDataController } from './controllers/storeMarketDataController';
import { getMarketDataController } from './controllers/getMarketDataController';
import { backhaulController } from './controllers/backhaulController';
import { chainController } from './controllers/chainController';
import {
  bookLoadController,
  bookChainController,
  manualIntelController,
  ingestSingleController,
  ingestBatchController,
} from './controllers/bookController';
import { initializeCpmInvalidationSubscriber } from './services/cpmInvalidationSubscriber';
import type { LoadIntelControllers } from './routes/loadIntelRoutes';
import type { IngestResult, IngestBatchResult } from './types/loadIntelTypes';

interface LoadIntelModuleDeps {
  prisma: PrismaClient;
  redis: Redis;
  eventBus: EventBus;
  logger: Logger;
}

interface LoadIntelModule {
  ingest: (orgId: string, payload: unknown) => Promise<IngestResult>;
  ingestBatch: (orgId: string, payloads: unknown[]) => Promise<IngestBatchResult>;
  controllers: LoadIntelControllers;
}

export const createLoadIntelModule = (deps: LoadIntelModuleDeps): LoadIntelModule => {
  const redisPort = createLoadIntelRedisAdapter(deps.redis);
  const fleetQuery = createFleetQueryAdapter(deps.prisma);
  const marketData = createMarketDataAdapter(deps.redis);
  const geoPort = createBackhaulGeoAdapter(deps.redis);

  const ingestServiceDeps = {
    redisPort,
    fleetQuery,
    marketData,
    logger: deps.logger,
  };

  const feedServiceDeps = {
    redisPort,
    logger: deps.logger,
  };

  const backhaulDeps = {
    redisPort,
    geoPort,
    logger: deps.logger,
  };

  const bookDeps = {
    redisPort,
    logger: deps.logger,
  };

  const marketServiceDeps = {
    redisPort,
    logger: deps.logger,
  };

  // Initialize event subscribers
  initializeCpmInvalidationSubscriber({
    eventBus: deps.eventBus,
    redisPort,
    logger: deps.logger,
  }).catch((error: unknown) => {
    deps.logger.error('Failed to initialize CPM invalidation subscriber', {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  const controllers: LoadIntelControllers = {
    getFeed: getFeedController({
      getFeed: (orgId, params) => getFeed(orgId, params, feedServiceDeps),
    }),
    getLoadById: getLoadByIdController({
      getLoadById: (orgId, loadHash) => getLoadById(orgId, loadHash, feedServiceDeps),
    }),
    dismissLoad: dismissLoadController({
      dismissLoad: (orgId, loadHash) => dismissLoad(orgId, loadHash, feedServiceDeps),
    }),
    storeMarketData: storeMarketDataController({
      storeMarketSnapshot: (input) => storeMarketSnapshot(input, marketServiceDeps),
    }),
    getMarketData: getMarketDataController({
      getMarketSnapshot: (state, city) => getMarketSnapshot(state, city, marketServiceDeps),
    }),
    searchBackhaul: backhaulController({
      searchBackhaul: (orgId, input) => searchBackhaul(orgId, input, backhaulDeps),
    }),
    getChains: chainController({
      assembleChain: (orgId, loadHash, vehicleId, limit) =>
        assembleChain(orgId, loadHash, vehicleId, limit, backhaulDeps),
    }),
    bookLoad: bookLoadController({
      bookLoad: (orgId, loadHash) => bookLoad(orgId, loadHash, bookDeps),
    }),
    bookChain: bookChainController({
      bookChain: (orgId, loadHash) => bookChain(orgId, loadHash, bookDeps),
    }),
    manualIngest: manualIntelController({
      ingest: (orgId, payload) => ingest(orgId, payload, ingestServiceDeps),
    }),
    ingestSingle: ingestSingleController({
      ingest: (orgId, payload) => ingest(orgId, payload, ingestServiceDeps),
    }),
    ingestBatch: ingestBatchController({
      ingestBatch: (orgId, payloads) => ingestBatch(orgId, payloads, ingestServiceDeps),
    }),
  };

  return {
    ingest: (orgId: string, payload: unknown) => ingest(orgId, payload, ingestServiceDeps),
    ingestBatch: (orgId: string, payloads: unknown[]) =>
      ingestBatch(orgId, payloads, ingestServiceDeps),
    controllers,
  };
};
