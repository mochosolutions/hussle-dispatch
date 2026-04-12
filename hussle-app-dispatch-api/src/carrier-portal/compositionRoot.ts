import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { carrierInviteTokenRepoPrisma } from './repositories/carrierInviteTokenRepoPrisma';
import { onboardingSessionRepoPrisma } from './repositories/onboardingSessionRepoPrisma';
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
import type { PortalDocument } from './types/portalDocumentsTypes';

interface CarrierPortalModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  logger: Logger;
}

export const createCarrierPortalModule = (deps: CarrierPortalModuleDeps) => {
  const tokenRepo = carrierInviteTokenRepoPrisma(deps.prismaClient);
  const sessionRepo = onboardingSessionRepoPrisma(deps.prismaClient);

  const carrierRepo = {
    findById: (id: string) => deps.prismaClient.carrier.findUnique({ where: { id } }),
    update: (id: string, data: Record<string, unknown>) =>
      deps.prismaClient.carrier.update({ where: { id }, data }),
  };

  const authenticateCarrierToken = createAuthenticateCarrierToken({ tokenRepo });

  const onboardingSessionService = createOnboardingSessionService({
    sessionRepo,
    carrierRepo,
    eventBus: deps.eventBus,
    logger: deps.logger,
  });

  const contactRepo = {
    upsertPrimaryContact: async (input: {
      organizationId: string;
      existingContactId: string | null;
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
    }) => {
      if (input.existingContactId !== null) {
        return deps.prismaClient.contact.update({
          where: { id: input.existingContactId },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            email: input.email,
          },
        });
      }

      return deps.prismaClient.contact.create({
        data: {
          organizationId: input.organizationId,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          email: input.email,
          role: 'primary_contact',
        },
      });
    },
  };

  const companyService = createPortalCompanyService({ carrierRepo, contactRepo });

  const equipmentService = createPortalEquipmentService({
    findCarrierById: async (carrierId: string) => {
      const carrier = await deps.prismaClient.carrier.findUnique({ where: { id: carrierId } });
      if (!carrier) {
        return null;
      }
      return { id: carrier.id, mcNumber: carrier.mcNumber, dotNumber: carrier.dotNumber };
    },
    deleteVehiclesByCarrierId: async (carrierId: string) => {
      await deps.prismaClient.vehicle.deleteMany({ where: { carrierId } });
    },
    createVehicles: async (data) => {
      const results = [];
      for (const v of data) {
        const vehicle = await deps.prismaClient.vehicle.create({ data: v });
        results.push({
          id: vehicle.id,
          category: vehicle.category,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
        });
      }
      return results;
    },
  });

  const driversService = createPortalDriversService({ prisma: deps.prismaClient });

  const carrierCostProfileRepo = {
    findById: async (id: string) => {
      const carrier = await deps.prismaClient.carrier.findUnique({ where: { id } });
      if (!carrier) {
        return null;
      }
      return {
        id: carrier.id,
        dispatchFeePercent: Number(carrier.dispatchFeePercent ?? 0),
        costProfileVersion: carrier.costProfileVersion ?? 0,
      };
    },
    updateCostProfile: async (
      id: string,
      data: { minimumRatePerMile: number; costProfileVersion: number; costProfileSource: string },
    ) => {
      await deps.prismaClient.carrier.update({
        where: { id },
        data: {
          minimumRatePerMile: data.minimumRatePerMile,
          costProfileVersion: data.costProfileVersion,
          costProfileSource: data.costProfileSource,
        },
      });
    },
  };

  const costAnalysisService = createPortalCostAnalysisService({ carrierCostProfileRepo });

  const lanePreferencesSessionPort = {
    getAnswers: async (carrierId: string) => {
      const session = await deps.prismaClient.onboardingSession.findUnique({
        where: { carrierId },
      });
      if (!session) {
        return null;
      }
      const raw = session.answers;
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return {};
      }
      return raw;
    },
    updateAnswers: async (carrierId: string, answers: Record<string, unknown>) => {
      const jsonValue = JSON.parse(JSON.stringify(answers));
      await deps.prismaClient.onboardingSession.update({
        where: { carrierId },
        data: { answers: jsonValue },
      });
    },
  };

  const lanePreferencesService = createPortalLanePreferencesService({
    sessionPort: lanePreferencesSessionPort,
  });

  const mapDocumentRow = (row: {
    id: string;
    type: string;
    fileName: string;
    s3Url: string;
    reviewStatus: string | null;
    signatureData: string | null;
    signedAt: Date | null;
    createdAt: Date;
  }): PortalDocument => ({
    id: row.id,
    documentType: row.type,
    fileName: row.fileName,
    fileUrl: row.s3Url,
    reviewStatus: row.reviewStatus,
    signatureData: row.signatureData,
    signedAt: row.signedAt,
    createdAt: row.createdAt,
  });

  const documentRepoPort = {
    listByCarrier: async (carrierId: string, organizationId: string) => {
      const rows = await deps.prismaClient.document.findMany({
        where: { entityType: 'carrier', entityId: carrierId, organizationId, isArchived: false },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(mapDocumentRow);
    },
    create: async (data: {
      organizationId: string;
      entityType: string;
      entityId: string;
      type: string;
      fileName: string;
      s3Key: string;
      s3Url: string;
      uploadStatus: string;
    }) => {
      const row = await deps.prismaClient.document.create({
        data: {
          organizationId: data.organizationId,
          entityType: data.entityType,
          entityId: data.entityId,
          type: data.type as 'DISPATCH_AGREEMENT' | 'INSURANCE_CERT' | 'W9' | 'CARRIER_PACKET',
          fileName: data.fileName,
          s3Key: data.s3Key,
          s3Url: data.s3Url,
          uploadStatus: data.uploadStatus,
        },
      });
      return mapDocumentRow(row);
    },
    findById: async (id: string) => {
      const row = await deps.prismaClient.document.findUnique({ where: { id } });
      if (!row) {
        return null;
      }
      return mapDocumentRow(row);
    },
    findByIdAndCarrier: async (id: string, carrierId: string, organizationId: string) => {
      const row = await deps.prismaClient.document.findFirst({
        where: { id, entityType: 'carrier', entityId: carrierId, organizationId },
      });
      if (!row) {
        return null;
      }
      return mapDocumentRow(row);
    },
    updateStatus: async (id: string, data: { uploadStatus: string; reviewStatus?: string }) => {
      const row = await deps.prismaClient.document.update({
        where: { id },
        data: {
          uploadStatus: data.uploadStatus,
          ...(data.reviewStatus ? { reviewStatus: data.reviewStatus } : {}),
        },
      });
      return mapDocumentRow(row);
    },
    updateSignature: async (
      id: string,
      data: { signatureData: string; signedAt: Date; uploadStatus: string; reviewStatus?: string },
    ) => {
      const row = await deps.prismaClient.document.update({
        where: { id },
        data: {
          signatureData: data.signatureData,
          signedAt: data.signedAt,
          uploadStatus: data.uploadStatus,
          ...(data.reviewStatus ? { reviewStatus: data.reviewStatus } : {}),
        },
      });
      return mapDocumentRow(row);
    },
  };

  const carrierCompliancePort = {
    updateComplianceFlags: async (carrierId: string, flags: Record<string, unknown>) => {
      await deps.prismaClient.carrier.update({
        where: { id: carrierId },
        data: flags,
      });
    },
  };

  const presignPort = {
    generatePresignedPutUrl,
    buildCarrierDocumentKey,
  };

  const documentsService = createPortalDocumentsService({
    documentRepo: documentRepoPort,
    carrierCompliance: carrierCompliancePort,
    presignPort,
    s3Bucket: env.S3_BUCKET,
  });

  const controllers = {
    session: createSessionControllers({ sessionService: onboardingSessionService, carrierQuery: carrierRepo }),
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
