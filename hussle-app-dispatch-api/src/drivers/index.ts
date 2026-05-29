import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { sharedEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';
import { createDriversModule } from './compositionRoot';
import { createDriversRouter } from './routes/driverRoutes';

const driversModule = createDriversModule({
  prismaClient: prisma,
  redis: redisClient,
  logger,
  eventBus: sharedEventBus,
});

driversModule.initializeSubscribers().catch((error: unknown) => {
  logger.error('Failed to initialize driver subscribers', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const driversRouter = createDriversRouter(driversModule.controllers);
export const driverQueries = driversModule.queries;
