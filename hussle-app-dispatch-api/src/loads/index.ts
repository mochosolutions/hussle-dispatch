import { prisma } from '@/shared/prisma';
import { createInMemoryEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';
import { createLoadsModule } from './compositionRoot';
import { createLoadsRouter } from './routes/loadRoutes';

// TODO: Replace with shared eventBus instance when module wiring is centralized
const eventBus = createInMemoryEventBus();

const loadsModule = createLoadsModule({
  prismaClient: prisma,
  eventBus,
  logger,
});

export const loadsRouter = createLoadsRouter(loadsModule.controllers);
