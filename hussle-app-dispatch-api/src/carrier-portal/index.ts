import { prisma } from '@/config/database';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { logger } from '@/shared/utils/logger';
import { createCarrierPortalModule } from './compositionRoot';
import { createCarrierPortalRouter } from './routes';

const carrierPortalModule = createCarrierPortalModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  logger,
});

export const carrierPortalRouter = createCarrierPortalRouter(
  carrierPortalModule.controllers,
  carrierPortalModule.middleware,
);
