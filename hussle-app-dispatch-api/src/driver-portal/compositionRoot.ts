import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { SmsService } from '@/shared/notifications/smsService';
import type { Logger } from '@/shared/utils/logger';
import type { TrackingTokenService } from '../notifications/services/trackingTokenService';
import type { LoadStatusService } from '../loads/services/loadStatusService';
import type { DocumentService } from '../documents/types/documentServiceTypes';
import type { NotificationLogRepoPort } from '../notifications/types/notificationRepoPort';
import type { TrackingTokenRepoPort } from '../notifications/types/trackingTokenTypes';
import { driverPortalLoadQueryPrisma } from './repositories/driverPortalLoadQueryPrisma';
import { driverPortalCheckCallRepositoryPrisma } from './repositories/driverPortalCheckCallRepositoryPrisma';
import { createDriverPortalService } from './services/driverPortalService';
import { createSendDriverLinkController } from './controllers/sendDriverLinkController';
import { createDriverPortalControllers } from './controllers/driverPortalController';
import { createAuthenticateDriverToken } from './middleware/authenticateDriverToken';
import { initializeDriverPortalSmsSubscriber } from './services/driverPortalSmsSubscriber';

type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

interface DriverPortalModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  smsService: SmsService;
  logger: Logger;
  trackingBaseUrl: string;
  trackingTokenService: TrackingTokenService;
  loadStatusService: LoadStatusService;
  documentService: DocumentService;
  logRepo: NotificationLogRepoPort;
  tokenRepo: TrackingTokenRepoPort;
}

export const createDriverPortalModule = (deps: DriverPortalModuleDeps) => {
  const loadQuery = driverPortalLoadQueryPrisma(deps.prismaClient);
  const checkCallRepo = driverPortalCheckCallRepositoryPrisma(deps.prismaClient);

  const driverPortalService = createDriverPortalService({
    loadQuery,
    checkCallRepo,
    loadStatusService: deps.loadStatusService,
    eventBus: deps.eventBus,
    logger: deps.logger,
  });

  const authenticateDriverToken = createAuthenticateDriverToken({
    tokenRepo: deps.tokenRepo,
  });

  const controllers = {
    sendDriverLink: createSendDriverLinkController({
      loadQuery,
      trackingTokenService: deps.trackingTokenService,
      smsService: deps.smsService,
      logRepo: deps.logRepo,
      logger: deps.logger,
      trackingBaseUrl: deps.trackingBaseUrl,
    }),
    portal: createDriverPortalControllers({
      driverPortalService,
      documentService: deps.documentService,
    }),
  };

  const middleware = {
    authenticateDriverToken,
  };

  const initializeSubscriber = async () => {
    await initializeDriverPortalSmsSubscriber({
      eventBus: deps.eventBus,
      smsService: deps.smsService,
      trackingTokenService: deps.trackingTokenService,
      logRepo: deps.logRepo,
      loadQuery,
      logger: deps.logger,
      trackingBaseUrl: deps.trackingBaseUrl,
    });
  };

  return { controllers, middleware, initializeSubscriber };
};
