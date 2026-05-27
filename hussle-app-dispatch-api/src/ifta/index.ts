import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { logger } from '@/shared/utils/logger';
import { createIftaModule } from './compositionRoot';
import { createIftaRouter } from './routes/iftaRoutes';

const iftaModule = createIftaModule({
  prismaClient: prisma,
  redis: redisClient,
  eventBus: sharedEventBus,
  logger,
});

export const iftaRouter = createIftaRouter({
  stateMilesControllers: iftaModule.stateMilesControllers,
  iftaReportController: iftaModule.iftaReportController,
});

iftaModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize IFTA subscribers', {
    error: error instanceof Error ? error.message : String(error),
  });
});
