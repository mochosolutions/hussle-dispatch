import { prisma } from '@/config/database';
import { redisClient } from '@/shared/redisClient';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { logger } from '@/shared/utils/logger';
import { env } from '@/config/env';
import { PrismaTransactionManager } from '@/shared/prisma';
import { tokenProvider } from '@/auth/providers/tokenProvider';
import { trackingTokenService } from '../notifications';
import { loadStatusService } from '../loads';
import { documentService } from '../documents';
import { trackingTokenRepositoryPrisma } from '../notifications/repositories/trackingTokenRepositoryPrisma';
import { createDriverPortalModule } from './compositionRoot';
import { createDriverPortalRouter } from './routes/driverPortalRoutes';

const tokenRepo = trackingTokenRepositoryPrisma(prisma);
const transactionManager = new PrismaTransactionManager();
const tokenProviderInstance = tokenProvider({ client: redisClient });

const driverPortalModule = createDriverPortalModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  logger,
  trackingBaseUrl: env.TRACKING_BASE_URL,
  frontendUrl: env.FRONTEND_URL,
  trackingTokenService,
  loadStatusService,
  documentService,
  tokenRepo,
  tokenProviderInstance,
  transactionManager,
});

export const driverPortalRouter = createDriverPortalRouter(
  driverPortalModule.controllers,
  driverPortalModule.middleware,
);
