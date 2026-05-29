export { ingest, ingestBatch } from './services/loadIntelService';
export { getFeed, getLoadById, dismissLoad } from './services/loadIntelFeedService';
export {
  storeMarketSnapshot,
  getMarketSnapshot,
  calculateMarketTier,
} from './services/marketDataService';
export type {
  LoadIntelPayload,
  LoadIntelRedis,
  TruckScore,
  IngestResult,
  IngestBatchResult,
  FleetUnit,
  GeoPoint,
  BrokerInfo,
  FeedQueryParams,
  MarketSnapshot,
} from './types/loadIntelTypes';
export type {
  LoadIntelRedisPort,
  FleetQueryPort,
  MarketDataPort,
} from './types/loadIntelPorts';
export { createLoadIntelRedisAdapter } from './adapters/loadIntelRedisAdapter';
export { createFleetQueryAdapter } from './adapters/fleetQueryAdapter';
export { createMarketDataAdapter } from './adapters/marketDataAdapter';
export { loadIntelPayloadSchema } from './validators/loadIntelValidator';
export { createLoadIntelModule } from './compositionRoot';
export { loadIntelRoutes } from './routes/loadIntelRoutes';

// Wired router for mounting in app.ts
import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { sharedEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';
import { createLoadIntelModule } from './compositionRoot';
import { loadIntelRoutes } from './routes/loadIntelRoutes';

const loadIntelModule = createLoadIntelModule({
  prisma,
  redis: redisClient,
  eventBus: sharedEventBus,
  logger,
});

export const loadIntelRouter = loadIntelRoutes(loadIntelModule.controllers);

// Initialize subscriber for load-intel events — call initializeLoadIntelSubscriber() explicitly
export const initializeLoadIntelSubscriber = (): Promise<void> =>
  loadIntelModule.initializeSubscriber().catch((error: unknown) => {
    logger.error('Failed to initialize load-intel CPM invalidation subscriber', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
