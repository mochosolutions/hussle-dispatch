import { prisma } from '@/config/database';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { logger } from '@/shared/utils/logger';
import { env } from '@/config/env';
import { trackingTokenService } from '../notifications';
import { loadStatusService } from '../loads';
import { documentService } from '../documents';
import { trackingTokenRepositoryPrisma } from '../notifications/repositories/trackingTokenRepositoryPrisma';
import { createDriverPortalModule } from './compositionRoot';
import { createDriverPortalRouter } from './routes/driverPortalRoutes';

const tokenRepo = trackingTokenRepositoryPrisma(prisma);

const driverPortalModule = createDriverPortalModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  logger,
  trackingBaseUrl: env.TRACKING_BASE_URL,
  trackingTokenService,
  loadStatusService,
  documentService,
  tokenRepo,
});

export const driverPortalRouter = createDriverPortalRouter(
  driverPortalModule.controllers,
  driverPortalModule.middleware,
);
