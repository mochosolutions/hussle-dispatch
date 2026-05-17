import { AgreementTemplateKey, type PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { carrierInviteTokenRepoPrisma } from './repositories/carrierInviteTokenRepoPrisma';
import { carrierAuditPortPrisma } from '@/carriers/repositories/carrierAuditPortPrisma';
import { onboardingSessionRepoPrisma } from './repositories/onboardingSessionRepoPrisma';
import { portalCarrierRepoPrisma } from './repositories/portalCarrierRepoPrisma';
import { portalDocumentRepoPrisma } from './repositories/portalDocumentRepoPrisma';
import { portalVehicleRepoPrisma } from './repositories/portalVehicleRepoPrisma';
import { portalDriverRepoPrisma } from './repositories/portalDriverRepoPrisma';
import { portalLanePreferencesSessionRepoPrisma } from './repositories/portalSessionRepoPrisma';
import { createAuthenticateCarrierToken } from './middleware/authenticateCarrierToken';
import { createOnboardingSessionService } from './services/onboardingSessionService';
import { createPortalCompanyService } from './services/portalCompanyService';
import { createPortalEquipmentService } from './services/portalEquipmentService';
import { createPortalDriversService } from './services/portalDriversService';
import { createPortalCostAnalysisService } from './services/portalCostAnalysisService';
import { createSessionControllers } from './controllers/sessionController';
import { createCompanyControllers } from './controllers/companyController';
import { createEquipmentControllers } from './controllers/equipmentController';
import { createDriversControllers } from './controllers/driversController';
import { createCostAnalysisControllers } from './controllers/costAnalysisController';
import { createLanePreferencesControllers } from './controllers/lanePreferencesController';
import { createPortalLanePreferencesService } from './services/portalLanePreferencesService';
import { createDocumentsControllers } from './controllers/documentsController';
import { createPortalDocumentsService } from './services/portalDocumentsService';
import {
  generatePresignedPutUrl,
  buildCarrierDocumentKey,
} from '@/shared/s3Presign';
import { env } from '@/config/env';

interface CarrierPortalModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  logger: Logger;
}

export const createCarrierPortalModule = (deps: CarrierPortalModuleDeps) => {
  const tokenRepo = carrierInviteTokenRepoPrisma(deps.prismaClient);
  const sessionRepo = onboardingSessionRepoPrisma(deps.prismaClient);
  const carrierRepo = portalCarrierRepoPrisma(deps.prismaClient);
  const auditLog = carrierAuditPortPrisma(deps.prismaClient);
  const documentRepo = portalDocumentRepoPrisma(deps.prismaClient);
  const vehicleRepo = portalVehicleRepoPrisma(deps.prismaClient);
  const driverRepo = portalDriverRepoPrisma(deps.prismaClient);
  const laneSessionRepo = portalLanePreferencesSessionRepoPrisma(deps.prismaClient);

  const authenticateCarrierToken = createAuthenticateCarrierToken({ tokenRepo });

  // Session service uses carrierId from the token — scoping is enforced by the
  // authenticateCarrierToken middleware. The carrier repo calls here use
  // prismaClient directly because the session service interface predates the
  // scoped repo and only operates on the token-authenticated carrier.
  const onboardingSessionService = createOnboardingSessionService({
    sessionRepo,
    carrierRepo: {
      findById: (id: string) => deps.prismaClient.carrier.findUnique({ where: { id } }),
      update: (id: string, data: Record<string, unknown>) =>
        deps.prismaClient.carrier.update({ where: { id }, data }),
    },
    eventBus: deps.eventBus,
    logger: deps.logger,
    auditLog,
  });

  const companyService = createPortalCompanyService({ carrierRepo });

  const equipmentService = createPortalEquipmentService({
    findCarrierById: async (carrierId: string) => {
      try {
        const carrier = await deps.prismaClient.carrier.findUnique({ where: { id: carrierId } });
        if (!carrier) {
          return null;
        }
        return { id: carrier.id, mcNumber: carrier.mcNumber, dotNumber: carrier.dotNumber };
      } catch {
        return null;
      }
    },
    findVehiclesByCarrierId: (carrierId: string) => vehicleRepo.findByCarrierId(carrierId),
    upsertVehicles: (carrierId, data, deleteIds) =>
      vehicleRepo.upsertMany(carrierId, data, deleteIds),
  });

  const driversService = createPortalDriversService({ driverRepo });

  const costAnalysisService = createPortalCostAnalysisService({
    carrierCostProfileRepo: {
      findById: (carrierId, organizationId) =>
        carrierRepo.findCostProfile(carrierId, organizationId),
      updateCostProfile: (carrierId, organizationId, data) =>
        carrierRepo.updateCostProfile(carrierId, organizationId, data),
    },
  });

  const lanePreferencesService = createPortalLanePreferencesService({
    sessionPort: laneSessionRepo,
  });

  const documentsService = createPortalDocumentsService({
    documentRepo,
    carrierCompliance: {
      updateComplianceFlags: (carrierId, flags) => {
        // Documents service already receives organizationId from controller
        // and uses findByIdAndCarrier for document verification.
        // Compliance flag updates use carrierId which is token-scoped.
        return deps.prismaClient.carrier.update({
          where: { id: carrierId },
          data: flags,
        }).then(() => undefined);
      },
    },
    presignPort: {
      generatePresignedPutUrl,
      buildCarrierDocumentKey,
    },
    s3Bucket: env.S3_BUCKET,
  });

  const controllers = {
    session: createSessionControllers({
      sessionService: onboardingSessionService,
      carrierQuery: {
        findById: (id: string) => deps.prismaClient.carrier.findUnique({ where: { id } }),
      },
      invitationQuery: {
        findActiveOrganizationNameByCarrierId: async (carrierId: string) => {
          const token = await deps.prismaClient.carrierInviteToken.findFirst({
            where: {
              carrierId,
              revokedAt: null,
              organization: { is: { deleted: false } },
            },
            orderBy: { createdAt: 'desc' },
            include: { organization: true },
          });
          return token?.organization?.name ?? null;
        },
      },
      agreementQuery: {
        findLatestForCarrier: async (carrierId: string) => {
          const agreement = await deps.prismaClient.agreement.findFirst({
            where: { carrierId, templateKey: AgreementTemplateKey.DISPATCH_AGREEMENT },
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true, embedUrl: true },
          });
          if (!agreement) {
            return null;
          }
          return {
            id: agreement.id,
            status: agreement.status,
            embedUrl: agreement.embedUrl,
          };
        },
      },
    }),
    company: createCompanyControllers({ companyService }),
    equipment: createEquipmentControllers({ equipmentService }),
    drivers: createDriversControllers({ portalDriversService: driversService }),
    costAnalysis: createCostAnalysisControllers({ costAnalysisService }),
    lanePreferences: createLanePreferencesControllers({ lanePreferencesService }),
    documents: createDocumentsControllers({ documentsService }),
  };

  const middleware = {
    authenticateCarrierToken,
  };

  const services = {
    onboardingSessionService,
  };

  return { controllers, middleware, services };
};
