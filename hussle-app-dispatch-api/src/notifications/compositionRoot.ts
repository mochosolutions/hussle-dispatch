import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { NotificationService } from '@/shared/notifications/notificationService';
import type { SmsService } from '@/shared/notifications/smsService';
import type { Logger } from '@/shared/utils/logger';
import { notificationSettingsRepositoryPrisma } from './repositories/notificationSettingsRepositoryPrisma';
import { loadNotificationOverrideRepositoryPrisma } from './repositories/loadNotificationOverrideRepositoryPrisma';
import { notificationLogRepositoryPrisma } from './repositories/notificationLogRepositoryPrisma';
import {
  trackingTokenRepositoryPrisma,
  trackingLoadQueryPrisma,
} from './repositories/trackingTokenRepositoryPrisma';
import { createNotificationSettingsService } from './services/notificationSettingsService';
import { createLoadNotificationOverrideService } from './services/loadNotificationOverrideService';
import { createTrackingTokenService } from './services/trackingTokenService';
import { initializeNotificationSubscriber } from './services/notificationSubscriber';
import { initializeCarrierOnboardingSubscriber } from './services/carrierOnboardingSubscriber';
import { createNotificationSettingsControllers } from './controllers/notificationSettingsController';
import { createLoadNotificationControllers } from './controllers/loadNotificationController';
import { createTrackingControllers } from './controllers/trackingController';
import type { NotificationSettingsService } from './services/notificationSettingsService';
import type { LoadNotificationOverrideService } from './services/loadNotificationOverrideService';
import type { TrackingTokenService } from './services/trackingTokenService';
import type { NotificationRouterControllers } from './routes/notificationRoutes';

interface NotificationModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  emailService: NotificationService;
  smsService: SmsService;
  logger: Logger;
  trackingBaseUrl: string;
  frontendUrl: string;
  portalBaseUrl: string;
}

export interface NotificationModuleExports {
  settingsService: NotificationSettingsService;
  overrideService: LoadNotificationOverrideService;
  trackingTokenService: TrackingTokenService;
  controllers: NotificationRouterControllers;
  initializeSubscriber: () => Promise<void>;
}

export const createNotificationModule = (
  deps: NotificationModuleDeps,
): NotificationModuleExports => {
  const settingsRepo = notificationSettingsRepositoryPrisma(deps.prismaClient);
  const overrideRepo = loadNotificationOverrideRepositoryPrisma(deps.prismaClient);
  const logRepo = notificationLogRepositoryPrisma(deps.prismaClient);
  const tokenRepo = trackingTokenRepositoryPrisma(deps.prismaClient);
  const loadQuery = trackingLoadQueryPrisma(deps.prismaClient);

  const settingsService = createNotificationSettingsService({ settingsRepo });
  const overrideService = createLoadNotificationOverrideService({ overrideRepo });
  const trackingTokenService = createTrackingTokenService({ tokenRepo, loadQuery });

  const controllers: NotificationRouterControllers = {
    settings: createNotificationSettingsControllers({ settingsService }),
    loadNotification: createLoadNotificationControllers({ overrideService, logRepo }),
    tracking: createTrackingControllers({ trackingTokenService }),
  };

  const initializeSubscriber = async () => {
    await initializeNotificationSubscriber({
      eventBus: deps.eventBus,
      settingsRepo,
      overrideRepo,
      logRepo,
      tokenRepo,
      emailService: deps.emailService,
      smsService: deps.smsService,
      logger: deps.logger,
      trackingBaseUrl: deps.trackingBaseUrl,
      frontendUrl: deps.frontendUrl,
    });

    await initializeCarrierOnboardingSubscriber({
      eventBus: deps.eventBus,
      emailService: deps.emailService,
      smsService: deps.smsService,
      logger: deps.logger,
      portalBaseUrl: deps.portalBaseUrl,
      frontendUrl: deps.frontendUrl,
      membershipQuery: {
        findAdminByOrgId: async (organizationId: string) => {
          const membership = await deps.prismaClient.membership.findFirst({
            where: {
              organizationId,
              role: { in: ['admin', 'ADMIN'] },
              deleted: false,
              status: 'active',
            },
            include: {
              user: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          });

          if (!membership?.user) {
            return null;
          }

          return {
            email: membership.user.email,
            firstName: membership.user.firstName ?? '',
            lastName: membership.user.lastName ?? '',
          };
        },
      },
      organizationQuery: {
        findNameById: async (organizationId: string) => {
          const org = await deps.prismaClient.organization.findUnique({
            where: { id: organizationId },
            select: { name: true },
          });

          return org;
        },
      },
    });
  };

  return {
    settingsService,
    overrideService,
    trackingTokenService,
    controllers,
    initializeSubscriber,
  };
};
