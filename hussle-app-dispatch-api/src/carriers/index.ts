import { prisma } from '@/shared/prisma';
import { sharedEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';
import { createCarriersModule } from './compositionRoot';
import { createCarriersRouter } from './routes/carrierRoutes';

const carriersModule = createCarriersModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  logger,
});

// Initialize subscriber for carrier events
carriersModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize carrier subscriber', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const carriersRouter = createCarriersRouter(carriersModule.controllers);
