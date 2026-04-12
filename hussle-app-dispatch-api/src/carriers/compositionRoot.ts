import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { createApprovalControllers } from './controllers/approvalController';
import type { ApprovalControllers } from './controllers/approvalController';
import { createCarrierControllers } from './controllers/carrierController';
import type { CarrierControllers } from './controllers/carrierController';
import { createInviteControllers } from './controllers/inviteController';
import type { InviteControllers } from './controllers/inviteController';
import { createOnboardingDetailControllers } from './controllers/onboardingDetailController';
import type { OnboardingDetailControllers } from './controllers/onboardingDetailController';
import { carrierRepositoryPrisma } from './repositories/carrierRepositoryPrisma';
import { carrierStatsQueryPrisma } from './repositories/carrierStatsQueryPrisma';
import { carrierInviteTokenRepoPrisma } from '../carrier-portal/repositories/carrierInviteTokenRepoPrisma';
import { createCarrierApprovalService } from './services/carrierApprovalService';
import { createCarrierOnboardingDetailService } from './services/carrierOnboardingDetailService';
import { createCarrierService } from './services/carrierService';
import { createCarrierInviteService } from './services/carrierInviteService';
import { initializeCarrierSubscriber } from './services/carrierSubscriber';
import type { CarrierApprovalPort } from './types/approvalTypes';
import type { OnboardingDetailPort, OnboardingDetail } from './types/onboardingDetailTypes';

interface CarrierModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  logger: Logger;
}

export const createCarriersModule = ({
  prismaClient,
  eventBus,
  logger,
}: CarrierModuleDeps): {
  controllers: CarrierControllers & InviteControllers & ApprovalControllers & OnboardingDetailControllers;
  initializeSubscriber: () => Promise<void>;
} => {
  const repositories = carrierRepositoryPrisma(prismaClient);
  const carrierStatsQuery = carrierStatsQueryPrisma(prismaClient);
  const inviteTokenRepo = carrierInviteTokenRepoPrisma(prismaClient);

  const approvalPort: CarrierApprovalPort = {
    findById: (id, organizationId) =>
      prismaClient.carrier.findUnique({
        where: { id, managedByOrgId: organizationId, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          managedByOrgId: true,
          onboardingStatus: true,
          status: true,
          minimumRatePerMile: true,
        },
      }),
    approve: (id) =>
      prismaClient.carrier.update({
        where: { id },
        data: { status: 'ACTIVE', onboardingStatus: 'APPROVED' },
        select: {
          id: true,
          status: true,
          onboardingStatus: true,
          minimumRatePerMile: true,
        },
      }),
    reject: (id) =>
      prismaClient.carrier.update({
        where: { id },
        data: { onboardingStatus: 'REJECTED' },
        select: { id: true, onboardingStatus: true },
      }),
  };

  const carrierService = createCarrierService({
    carrierRepository: repositories,
    loadRepository: repositories,
    noteRepository: repositories,
  });

  const carrierInviteService = createCarrierInviteService({
    carrierRepo: repositories,
    inviteTokenRepo,
    eventBus,
  });

  const carrierApprovalService = createCarrierApprovalService({
    approvalPort,
  });

  const onboardingDetailPort: OnboardingDetailPort = {
    getOnboardingDetail: async (
      carrierId: string,
      organizationId: string,
    ): Promise<OnboardingDetail | null> => {
      const carrier = await prismaClient.carrier.findUnique({
        where: { id: carrierId, managedByOrgId: organizationId, deletedAt: null },
      });

      if (!carrier) {
        return null;
      }

      const [session, vehicles, drivers, documents] = await Promise.all([
        prismaClient.onboardingSession.findFirst({
          where: { carrierId },
        }),
        prismaClient.vehicle.findMany({
          where: { carrierId },
        }),
        prismaClient.driver.findMany({
          where: { carrierId },
        }),
        prismaClient.document.findMany({
          where: { entityType: 'carrier', entityId: carrierId },
        }),
      ]);

      const sessionRecord: Record<string, unknown> | null = session
        ? { ...session }
        : null;

      const answers = sessionRecord?.['answers'];
      const lanePreferences =
        typeof answers === 'object' && answers !== null &&
        !Array.isArray(answers) && 'lanePreferences' in answers
          ? (answers as Record<string, unknown>)['lanePreferences']
          : undefined;

      const lanePrefs = typeof lanePreferences === 'object' && lanePreferences !== null
        ? (lanePreferences as Record<string, unknown>)
        : undefined;

      return {
        carrier: { ...carrier },
        session: sessionRecord,
        vehicles: vehicles.map((v) => ({ ...v })),
        drivers: drivers.map((d) => ({ ...d })),
        documents: documents.map((doc) => ({ ...doc })),
        ...(lanePrefs !== undefined && { lanePreferences: lanePrefs }),
      };
    },
  };

  const carrierOnboardingDetailService = createCarrierOnboardingDetailService({
    onboardingDetailPort,
  });

  const carrierControllers = createCarrierControllers({
    carrierService,
    carrierStatsQuery,
  });

  const inviteControllers = createInviteControllers({
    carrierInviteService,
  });

  const approvalControllers = createApprovalControllers({
    carrierApprovalService,
    eventBus,
  });

  const onboardingDetailControllers = createOnboardingDetailControllers({
    carrierOnboardingDetailService,
  });

  const controllers = {
    ...carrierControllers,
    ...inviteControllers,
    ...approvalControllers,
    ...onboardingDetailControllers,
  };

  const initializeSubscriber = () =>
    initializeCarrierSubscriber({
      eventBus,
      carrierRepo: repositories,
      logger,
    });

  return { controllers, initializeSubscriber };
};
