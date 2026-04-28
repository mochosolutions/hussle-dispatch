import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { logger } from '@/shared/utils/logger';
import { getCityCoords } from '@/shared/geoLookup';
import { createDriversModule } from '@/drivers/compositionRoot';
import { createPlacesModule } from '@/places/compositionRoot';
import { settlementFreezeQueryPrisma } from '@/settlements/repositories/settlementFreezeQueryPrisma';
import { createLoadsModule } from './compositionRoot';
import { createLoadsRouter } from './routes/loadRoutes';

const driversModule = createDriversModule({ prismaClient: prisma, redis: redisClient, logger });
const placesModule = createPlacesModule({ prismaClient: prisma, redis: redisClient });
const settlementFreezeQuery = settlementFreezeQueryPrisma(prisma);

const loadsModule = createLoadsModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  logger,
  driverQueries: driversModule.queries,
  placeQueries: placesModule.queries,
  getCityCoords: (city, state) => getCityCoords(redisClient, state, city),
  settlementFreezeQuery,
});

export const loadsRouter = createLoadsRouter(
  loadsModule.controllers,
  loadsModule.stopControllers,
  loadsModule.accessorialControllers,
);

export const loadStatusService = loadsModule.loadStatusService;

// Initialize subscribers
loadsModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize loads subscribers', {
    error: error instanceof Error ? error.message : String(error),
  });
});
