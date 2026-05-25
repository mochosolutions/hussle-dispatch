import type { Request, Response } from 'express';
import type { OnboardingSession, Carrier, Prisma } from '@prisma/client';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors/commonErrors';
import {
  computeAgreementStatus,
  type DerivedComplianceDeps,
} from '@/carriers/services/derivedCompliance';
import type { VehiclePrefillRow } from '../repositories/portalVehicleRepoPrisma';
import type { DriverPrefillRow } from '../repositories/portalDriverRepoPrisma';
import type { PortalDocument } from '../types/portalDocumentsTypes';

interface SessionService {
  getOrCreate(carrierId: string): Promise<OnboardingSession>;
  submitStep(
    carrierId: string,
    input: { stepId: string; answers: Record<string, Prisma.InputJsonValue> },
  ): Promise<OnboardingSession>;
  complete(carrierId: string): Promise<OnboardingSession>;
}

interface CarrierQueryPort {
  findById(id: string): Promise<Carrier | null>;
}

interface InvitationQueryPort {
  findActiveOrganizationNameByCarrierId(carrierId: string): Promise<string | null>;
}

interface AgreementSnapshotPort {
  findLatestForCarrier(
    carrierId: string,
  ): Promise<{ id: string; status: string; embedUrl: string | null } | null>;
}

interface VehiclePrefillPort {
  findPrefillByCarrierId(carrierId: string): Promise<VehiclePrefillRow[]>;
}

interface DriverPrefillPort {
  findPrefillByCarrierId(carrierId: string): Promise<DriverPrefillRow[]>;
}

interface PortalDocumentsQueryPort {
  listByCarrier(carrierId: string, organizationId: string): Promise<PortalDocument[]>;
}

interface SessionControllerDeps {
  sessionService: SessionService;
  carrierQuery: CarrierQueryPort;
  invitationQuery: InvitationQueryPort;
  agreementQuery: AgreementSnapshotPort;
  vehiclePrefillQuery: VehiclePrefillPort;
  driverPrefillQuery: DriverPrefillPort;
  documentsQuery: PortalDocumentsQueryPort;
  derivedComplianceDeps: DerivedComplianceDeps;
}

const getCarrierId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.carrierId;
};

const getOrganizationId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.organizationId;
};

export const createSessionControllers = (deps: SessionControllerDeps) => ({
  getSession: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const organizationId = getOrganizationId(req);
    const [session, carrier, organizationName, agreement, vehicles, drivers, documents] =
      await Promise.all([
        deps.sessionService.getOrCreate(carrierId),
        deps.carrierQuery.findById(carrierId),
        deps.invitationQuery.findActiveOrganizationNameByCarrierId(carrierId),
        deps.agreementQuery.findLatestForCarrier(carrierId),
        deps.vehiclePrefillQuery.findPrefillByCarrierId(carrierId),
        deps.driverPrefillQuery.findPrefillByCarrierId(carrierId),
        deps.documentsQuery.listByCarrier(carrierId, organizationId),
      ]);

    const carrierSummary = carrier
      ? {
          id: carrier.id,
          name: carrier.name,
          email: carrier.email,
          phone: carrier.phone,
          status: carrier.status,
          type: carrier.type,
        }
      : null;

    // `company` projects typed Carrier columns onto the session response so
    // per-step pages can `prefillFrom: 'company.<field>'` when the user
    // navigates back. The answers JSON blob no longer carries typed fields
    // for migrated steps (B2+), so this is the durable source for prefill.
    const companyContext = carrier
      ? {
          legalName: carrier.legalName ?? null,
          dbaName: carrier.dbaName ?? null,
          taxClassification: carrier.taxClassification ?? null,
          tinType: carrier.tinType ?? null,
          tin: carrier.tin ?? null,
          mcNumber: carrier.mcNumber ?? null,
          dotNumber: carrier.dotNumber ?? null,
          ein: carrier.ein ?? null,
          phone: carrier.phone ?? null,
          email: carrier.email ?? null,
          signatoryName: carrier.signatoryName ?? null,
          signatoryTitle: carrier.signatoryTitle ?? null,
          address: carrier.address ?? null,
          city: carrier.city ?? null,
          state: carrier.state ?? null,
          zip: carrier.zip ?? null,
          lat: carrier.lat ?? null,
          lng: carrier.lng ?? null,
        }
      : null;

    // Source the lock decision from the derived agreement status (computed on
    // read) rather than the legacy Carrier.dispatchAgreementSignedAt projection.
    const agreementStatus = await computeAgreementStatus(carrierId, deps.derivedComplianceDeps);
    const signedFieldsLocked = carrier ? agreementStatus.signedAt !== null : false;

    // `costAnalysis` mirrors the cost ledger written by
    // `portalCostAnalysisWriteAdapter` into `answers.costAnalysis`. Project it
    // onto the session response so the cost-analysis step can prefill on
    // back-navigation. The per-vehicle authoritative columns (Vehicle.loanPayment
    // etc.) are still the source of truth for settlements.
    const answersRecord = (session.answers ?? {}) as Record<string, unknown>;
    const costAnalysisRaw = answersRecord.costAnalysis;
    const costAnalysisContext =
      typeof costAnalysisRaw === 'object' && costAnalysisRaw !== null ? costAnalysisRaw : null;

    // `lanePreferences` projects the typed Carrier columns + answers mirror so
    // the lane-prefs step can prefill. Carrier columns are the authoritative
    // store; the answers mirror carries the per-driver overrides that
    // `portalLanePreferencesWriteAdapter` writes into Driver columns.
    const lanePreferencesRaw = answersRecord.lanePreferences;
    const lanePreferencesContext = carrier
      ? {
          homeBaseCity: carrier.homeBaseCity ?? null,
          homeBaseState: carrier.homeBaseState ?? null,
          maxDaysOut: carrier.maxDaysOut ?? null,
          preferredLanes: carrier.preferredLanes ?? null,
          weeklySchedule: carrier.weeklySchedule ?? null,
          freightPreferences: carrier.freightPreferences ?? null,
          // Mirror of the full input payload (fleet + overrides) so the
          // step can rehydrate per-driver overrides too.
          mirror:
            typeof lanePreferencesRaw === 'object' && lanePreferencesRaw !== null
              ? lanePreferencesRaw
              : null,
        }
      : null;

    // `documents` projects the carrier's uploaded portal documents (currently
    // limited to types like INSURANCE_CERT, W9). Surfaces upload state to the
    // signing+upload step's unified row list so re-renders on cold load show
    // which document slots are already filled.
    const documentsContext = documents.map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      uploadedAt: doc.createdAt.toISOString(),
    }));

    sendSingle(res, {
      session,
      carrier: carrierSummary,
      company: companyContext,
      vehicles,
      drivers,
      costAnalysis: costAnalysisContext,
      lanePreferences: lanePreferencesContext,
      documents: documentsContext,
      agreement: agreement ? { ...agreement, signedFieldsLocked } : null,
      invitation: {
        email: carrier?.email ?? null,
        phone: carrier?.phone ?? null,
        organizationName,
      },
    });
  },

  submitStep: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const { stepId, answers } = req.body as {
      stepId: string;
      answers: Record<string, Prisma.InputJsonValue>;
    };
    const session = await deps.sessionService.submitStep(carrierId, { stepId, answers });
    sendSingle(res, session);
  },

  completeSession: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const session = await deps.sessionService.complete(carrierId);
    sendSingle(res, session);
  },
});
