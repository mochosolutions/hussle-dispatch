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
import { carrierAuditPortPrisma } from './repositories/carrierAuditPortPrisma';
import { carrierInviteTokenRepoPrisma } from '../carrier-portal/repositories/carrierInviteTokenRepoPrisma';
import { createCarrierApprovalService } from './services/carrierApprovalService';
import { createCarrierOnboardingDetailService } from './services/carrierOnboardingDetailService';
import { createCarrierService } from './services/carrierService';
import { createCarrierInviteService } from './services/carrierInviteService';
import { createDispatchOverrideService } from './services/dispatchOverrideService';
import { createCarrierSuspendService } from './services/carrierSuspendService';
import { initializeCarrierSubscriber } from './services/carrierSubscriber';
import { initializeCarrierComplianceSubscriber } from './services/carrierComplianceSubscriber';
import { createDispatchOverrideControllers } from './controllers/dispatchOverrideController';
import type { DispatchOverrideControllers } from './controllers/dispatchOverrideController';
import { createSuspendControllers } from './controllers/suspendController';
import type { SuspendControllers } from './controllers/suspendController';
import type { CarrierApprovalPort } from './types/approvalTypes';
import type { CarrierSuspendPort } from './types/suspendTypes';
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
  controllers: CarrierControllers & InviteControllers & ApprovalControllers & OnboardingDetailControllers & DispatchOverrideControllers & SuspendControllers;
  initializeSubscriber: () => Promise<void>;
  initializeComplianceSubscriber: () => Promise<void>;
} => {
  const repositories = carrierRepositoryPrisma(prismaClient);
  const carrierStatsQuery = carrierStatsQueryPrisma(prismaClient);
  const inviteTokenRepo = carrierInviteTokenRepoPrisma(prismaClient);
  const auditLog = carrierAuditPortPrisma(prismaClient);

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
          status: true,
          minimumRatePerMile: true,
        },
      }),
    setStatus: (id, status) =>
      prismaClient.carrier.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          status: true,
          minimumRatePerMile: true,
        },
      }),
  };

  const carrierService = createCarrierService({
    carrierRepository: repositories,
    loadRepository: repositories,
    noteRepository: repositories,
    auditLog,
  });

  const carrierInviteService = createCarrierInviteService({
    carrierRepo: repositories,
    inviteTokenRepo,
    eventBus,
    auditLog,
  });

  const carrierApprovalService = createCarrierApprovalService({
    approvalPort,
    auditLog,
  });

  const suspendPort: CarrierSuspendPort = {
    findById: (id, organizationId) =>
      prismaClient.carrier.findUnique({
        where: { id, managedByOrgId: organizationId, deletedAt: null },
        select: {
          id: true,
          name: true,
          managedByOrgId: true,
          status: true,
          type: true,
          dispatchAgreementOnFile: true,
          insuranceCertOnFile: true,
          insuranceExpiry: true,
          w9OnFile: true,
        },
      }),
    setStatus: (id, status) =>
      prismaClient.carrier.update({
        where: { id },
        data: { status },
        select: { id: true, status: true },
      }),
  };

  const carrierSuspendService = createCarrierSuspendService({
    suspendPort,
    auditLog,
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

  const dispatchOverrideService = createDispatchOverrideService({
    carrierQuery: {
      findById: (id: string, organizationId: string) =>
        prismaClient.carrier.findFirst({
          where: { id, managedByOrgId: organizationId, deletedAt: null },
          select: {
            id: true,
            name: true,
            type: true,
            dispatchAgreementOnFile: true,
            insuranceCertOnFile: true,
            insuranceExpiry: true,
            w9OnFile: true,
          },
        }),
    },
    loadQuery: {
      findById: (id: string, organizationId: string) =>
        prismaClient.load.findFirst({
          where: { id, organizationId, deletedAt: null },
          select: {
            id: true,
            organizationId: true,
            onboardingOverride: true,
            onboardingOverrideReason: true,
          },
        }),
      updateOverride: (
        id: string,
        data: { onboardingOverride: boolean; onboardingOverrideReason: string },
      ) =>
        prismaClient.load.update({
          where: { id },
          data,
          select: {
            id: true,
            organizationId: true,
            onboardingOverride: true,
            onboardingOverrideReason: true,
          },
        }),
    },
    auditLog,
  });

  const dispatchOverrideControllers = createDispatchOverrideControllers({
    dispatchOverrideService,
  });

  const suspendControllers = createSuspendControllers({
    carrierSuspendService,
  });

  const controllers = {
    ...carrierControllers,
    ...inviteControllers,
    ...approvalControllers,
    ...onboardingDetailControllers,
    ...dispatchOverrideControllers,
    ...suspendControllers,
  };

  const initializeSubscriber = () =>
    initializeCarrierSubscriber({
      eventBus,
      carrierRepo: repositories,
      logger,
      auditLog,
    });

  const initializeComplianceSubscriber = () =>
    initializeCarrierComplianceSubscriber({
      eventBus,
      carrierCompliance: {
        updateComplianceFlags: async (carrierId, organizationId, flags) => {
          await prismaClient.carrier.update({
            where: { id: carrierId, managedByOrgId: organizationId },
            data: flags,
          });
        },
      },
      logger,
    });

  return { controllers, initializeSubscriber, initializeComplianceSubscriber };
};
