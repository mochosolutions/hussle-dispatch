import { prisma } from '@/config/database';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { createSmsService } from '@/shared/notifications';
import { logger } from '@/shared/utils/logger';
import { env } from '@/config/env';
import { trackingTokenService } from '../notifications';
import { loadStatusService } from '../loads';
import { documentService } from '../documents';
import { notificationLogRepositoryPrisma } from '../notifications/repositories/notificationLogRepositoryPrisma';
import { trackingTokenRepositoryPrisma } from '../notifications/repositories/trackingTokenRepositoryPrisma';
import { createDriverPortalModule } from './compositionRoot';
import { createDriverPortalRouter } from './routes/driverPortalRoutes';

const smsService = createSmsService({ backend: 'console' }, logger);
const logRepo = notificationLogRepositoryPrisma(prisma);
const tokenRepo = trackingTokenRepositoryPrisma(prisma);

const driverPortalModule = createDriverPortalModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  smsService,
  logger,
  trackingBaseUrl: env.TRACKING_BASE_URL,
  trackingTokenService,
  loadStatusService,
  documentService,
  logRepo,
  tokenRepo,
});

// Initialize the SMS subscriber for auto-sending driver links on dispatch
driverPortalModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize driver portal SMS subscriber', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const driverPortalRouter = createDriverPortalRouter(
  driverPortalModule.controllers,
  driverPortalModule.middleware,
);
