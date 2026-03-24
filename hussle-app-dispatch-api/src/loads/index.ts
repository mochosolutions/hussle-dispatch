import { prisma } from '@/shared/prisma';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { logger } from '@/shared/utils/logger';
import { createLoadsModule } from './compositionRoot';
import { createLoadsRouter } from './routes/loadRoutes';

const loadsModule = createLoadsModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  logger,
});

export const loadsRouter = createLoadsRouter(
  loadsModule.controllers,
  loadsModule.stopControllers,
  loadsModule.accessorialControllers,
);

export const loadStatusService = loadsModule.loadStatusService;
