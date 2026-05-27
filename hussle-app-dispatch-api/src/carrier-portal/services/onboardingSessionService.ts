import {
  CarrierStatus,
  type Carrier,
  type OnboardingSession,
  type Prisma,
  type VehicleCategory,
} from '@prisma/client';
import type {
  OnboardingSessionRepoPort,
  OnboardingSessionUpdateData,
} from '../types/onboardingSessionRepoPort';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import {
  FieldLockedError,
  NotFoundError,
  OnboardingBlockError,
  ValidationError,
} from '@/shared/errors/commonErrors';
import { checkCarrierOnboarding } from '@/shared/onboardingGate';
import { CARRIER_TYPES } from '@/shared/constants/carrierTypes';
import { assertTransition } from '@/carriers/services/carrierStateMachine';
import type { CarrierAuditPort } from '@/carriers/types/carrierAuditPort';
import {
  computeAgreementStatus,
  computeInsuranceStatus,
  type DerivedComplianceDeps,
} from '@/carriers/services/derivedCompliance';
const IDENTITY_QUESTION_IDS = new Set(['legalName', 'mcNumber', 'dotNumber']);

interface CarrierRepoPort {
  findById(id: string): Promise<Carrier | null>;
  update(id: string, data: Record<string, unknown>): Promise<Carrier>;
}

interface VehiclePersistedSummary {
  id: string;
  category: VehicleCategory | null;
  make: string | null;
  model: string | null;
  year: number | null;
}

interface DriverPersistedSummary {
  id: string;
  firstName: string;
  lastName: string;
}

interface EquipmentVehicleEntry {
  id?: string;
  category: VehicleCategory;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  gvwr?: number;
}

interface EquipmentServicePort {
  saveEquipment: (input: {
    carrierId: string;
    organizationId: string;
    vehicles: EquipmentVehicleEntry[];
  }) => Promise<VehiclePersistedSummary[]>;
}

interface DriverEntry {
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  payType?: string;
  payRate?: number;
}

interface DriversServicePort {
  saveDrivers: (input: {
    carrierId: string;
    hasAdditionalDrivers: boolean;
    drivers?: DriverEntry[];
  }) => Promise<DriverPersistedSummary[]>;
}

interface OnboardingSessionServiceDeps {
  sessionRepo: OnboardingSessionRepoPort;
  carrierRepo: CarrierRepoPort;
  eventBus: EventBus;
  logger: Logger;
  auditLog: CarrierAuditPort;
  derivedComplianceDeps: DerivedComplianceDeps;
  equipmentService?: EquipmentServicePort;
  driversService?: DriversServicePort;
}

const writeStatusAudit = async (
  deps: OnboardingSessionServiceDeps,
  args: {
    organizationId: string;
    carrierId: string;
    action: string;
    fromStatus: CarrierStatus;
    toStatus: CarrierStatus;
  },
): Promise<void> => {
  await deps.auditLog
    .create(args.organizationId, {
      userId: null,
      action: args.action,
      entityType: 'CARRIER',
      entityId: args.carrierId,
      changes: { status: { old: args.fromStatus, new: args.toStatus } },
      metadata: null,
    })
    .catch(() => undefined);
};

export interface SubmitStepInput {
  stepId: string;
  answers: Record<string, Prisma.InputJsonValue>;
}

// Only company-phase stepIds can carry lockable fields.
const isCompanyStep = (stepId: string): boolean => stepId.startsWith('company-');

interface AssertNoLockedFieldChangeInput {
  stepId: string;
  incomingAnswers: Record<string, Prisma.InputJsonValue>;
  existingAnswers: Record<string, unknown>;
  carrier: Carrier | null;
  // Derived: signed agreement timestamp, computed via computeAgreementStatus.
  // `null` means no signed agreement, so company-step identity fields are not locked.
  agreementSignedAt: Date | null;
}

const assertNoLockedFieldChange = ({
  stepId,
  incomingAnswers,
  existingAnswers,
  carrier,
  agreementSignedAt,
}: AssertNoLockedFieldChangeInput): void => {
  if (!carrier || agreementSignedAt === null) {
    return;
  }
  if (!isCompanyStep(stepId)) {
    return;
  }

  const existingStepAnswers = (existingAnswers[stepId] ?? {}) as Record<string, unknown>;
  for (const [questionId, incomingValue] of Object.entries(incomingAnswers)) {
    if (!IDENTITY_QUESTION_IDS.has(questionId)) continue;
    const existing = existingStepAnswers[questionId];
    const a = incomingValue === null ? null : String(incomingValue);
    const b = existing === null || existing === undefined ? null : String(existing);
    if (a !== b) {
      throw new FieldLockedError(`company.${questionId}`);
    }
  }
};

export const createOnboardingSessionService = (deps: OnboardingSessionServiceDeps) => ({
  getOrCreate: async (carrierId: string): Promise<OnboardingSession> => {
    const existing = await deps.sessionRepo.findByCarrierId(carrierId);

    if (existing) {
      const updated = await deps.sessionRepo.update(existing.id, {
        lastActiveAt: new Date(),
      });
      deps.logger.info('Onboarding session resumed', { carrierId });
      return updated;
    }

    const created = await deps.sessionRepo.create({ carrierId });
    // BUG-01: seed currentStepId so the UI lands on the first step instead of
    // spinning indefinitely waiting for a step id to materialize.
    const session = await deps.sessionRepo.update(created.id, {
      currentStepId: 'welcome-segmentation',
    });

    const carrier = await deps.carrierRepo.findById(carrierId);
    if (carrier && carrier.status === CarrierStatus.INVITED) {
      assertTransition(carrier.status, CarrierStatus.ONBOARDING);
      await deps.carrierRepo.update(carrierId, { status: CarrierStatus.ONBOARDING });
      await writeStatusAudit(deps, {
        organizationId: carrier.managedByOrgId,
        carrierId,
        action: 'CARRIER_ONBOARDING_STARTED',
        fromStatus: carrier.status,
        toStatus: CarrierStatus.ONBOARDING,
      });
      deps.logger.info('Carrier status set to ONBOARDING', { carrierId });
    }

    deps.logger.info('Onboarding session created', { carrierId, sessionId: session.id });
    return session;
  },

  complete: async (carrierId: string): Promise<OnboardingSession> => {
    const session = await deps.sessionRepo.findByCarrierId(carrierId);

    if (!session) {
      throw new NotFoundError(`Onboarding session for carrier ${carrierId} not found`);
    }

    // Idempotent — if the session is already complete, return as-is. Prevents
    // re-running the status transition (PENDING_APPROVAL → PENDING_APPROVAL
    // throws InvalidTransitionError) when the frontend re-dispatches or a
    // saga races.
    if (session.completedAt !== null) {
      return session;
    }

    // The wizard's linear progression is the gate: the carrier reaches
    // `/complete` only after submitStep on `sign-agreement` succeeds, which
    // requires every prior required step's Continue gate to have passed.
    // `completedStepIds` is the durable signal — it's written by every
    // submitStep call. The legacy numeric `completedPhases` gate is no
    // longer authoritative (the modern saga flow never writes it).
    if (!(session.completedStepIds ?? []).includes('sign-agreement')) {
      throw new ValidationError(
        'Cannot complete onboarding: sign-agreement step has not been submitted',
        ['sign-agreement step is incomplete'],
      );
    }

    const carrier = await deps.carrierRepo.findById(carrierId);
    const carrierName = carrier?.name ?? 'Unknown';

    if (carrier && carrier.type !== CARRIER_TYPES.COMPANY_ASSET) {
      const [insurance, agreement] = await Promise.all([
        computeInsuranceStatus(carrier.id, deps.derivedComplianceDeps),
        computeAgreementStatus(carrier.id, deps.derivedComplianceDeps),
      ]);
      const onboardingResult = checkCarrierOnboarding({
        carrierType: carrier.type,
        dispatchAgreementOnFile: agreement.onFile,
        insuranceCertOnFile: insurance.onFile,
        insuranceExpiry: insurance.expiresAt,
        tinOnFile: carrier.tin !== null,
      });

      if (!onboardingResult.allowed) {
        throw new OnboardingBlockError(carrierName, onboardingResult.missingDocuments);
      }
    }

    // Pre-check the status transition before persisting completedAt so a
    // bad state doesn't wedge retries (without this, completedAt gets set
    // even if the transition throws, and the UI's mount-effect won't
    // re-dispatch completeSession on the next visit).
    if (carrier) {
      assertTransition(carrier.status, CarrierStatus.PENDING_APPROVAL);
    }

    const updated = await deps.sessionRepo.update(session.id, {
      completedAt: new Date(),
    });

    if (carrier) {
      await deps.carrierRepo.update(carrierId, { status: CarrierStatus.PENDING_APPROVAL });
      await writeStatusAudit(deps, {
        organizationId: carrier.managedByOrgId,
        carrierId,
        action: 'CARRIER_ONBOARDING_COMPLETED',
        fromStatus: carrier.status,
        toStatus: CarrierStatus.PENDING_APPROVAL,
      });
    }

    const organizationId = carrier?.managedByOrgId ?? '';

    await deps.eventBus.publish('carrier.onboarding.completed', {
      carrierId,
      organizationId,
      carrierName,
    });

    deps.logger.info('Onboarding completed', { carrierId, sessionId: session.id });

    return updated;
  },

  submitStep: async (carrierId: string, input: SubmitStepInput): Promise<OnboardingSession> => {
    const session = await deps.sessionRepo.findByCarrierId(carrierId);
    if (!session) {
      throw new NotFoundError(`Onboarding session for carrier ${carrierId} not found`);
    }

    const carrier = await deps.carrierRepo.findById(carrierId);

    // Derive the signed-agreement timestamp on read instead of trusting the
    // legacy Carrier.dispatchAgreementSignedAt projection column.
    const agreementStatus = await computeAgreementStatus(carrierId, deps.derivedComplianceDeps);

    const existingAnswers = (session.answers ?? {}) as Record<string, unknown>;
    assertNoLockedFieldChange({
      stepId: input.stepId,
      incomingAnswers: input.answers,
      existingAnswers,
      carrier,
      agreementSignedAt: agreementStatus.signedAt,
    });

    // ------------------------------------------------------------------
    // Route equipment-entry through portalEquipmentService so vehicles
    // get real Prisma-assigned UUIDs. Replace the incoming `vehicles`
    // payload with the persisted entities before writing to session.
    // ------------------------------------------------------------------
    let normalizedAnswers: Record<string, Prisma.InputJsonValue> = input.answers;

    if (input.stepId === 'equipment-entry' && deps.equipmentService && carrier) {
      const incoming = input.answers as Record<string, unknown>;
      const incomingVehicles = Array.isArray(incoming.vehicles)
        ? (incoming.vehicles as EquipmentVehicleEntry[])
        : null;

      if (incomingVehicles) {
        const persisted = await deps.equipmentService.saveEquipment({
          carrierId,
          organizationId: carrier.managedByOrgId,
          vehicles: incomingVehicles,
        });

        // Merge: keep incoming fields (year, make, vin, etc.) and overlay
        // the server-assigned `id` from the persisted summary. We pair by
        // index because portalEquipmentService preserves input order.
        const mergedVehicles = incomingVehicles.map((incomingVehicle, index) => {
          const persistedVehicle = persisted[index];
          return {
            ...incomingVehicle,
            id: persistedVehicle?.id ?? incomingVehicle.id,
          };
        });

        normalizedAnswers = {
          ...(input.answers as Record<string, Prisma.InputJsonValue>),
          vehicles: mergedVehicles as unknown as Prisma.InputJsonValue,
        };
      }
    }

    // ------------------------------------------------------------------
    // Route drivers-list through portalDriversService. UI ships the list
    // under `drivers` (canonical, mirrors Prisma + the dedicated POST
    // /carrier-portal/drivers contract). Legacy sessions may carry the
    // list under `entries`; accept either on read, always write `drivers`.
    // ------------------------------------------------------------------
    if (input.stepId === 'drivers-list' && deps.driversService) {
      const incoming = input.answers as Record<string, unknown>;
      let rawList: unknown[] | null = null;
      if (Array.isArray(incoming.drivers)) {
        rawList = incoming.drivers;
      } else if (Array.isArray(incoming.entries)) {
        rawList = incoming.entries;
      }
      const incomingDrivers = rawList as DriverEntry[] | null;
      const hasAdditionalDrivers =
        typeof incoming.hasAdditionalDrivers === 'boolean'
          ? incoming.hasAdditionalDrivers
          : Array.isArray(incomingDrivers) && incomingDrivers.length > 0;

      if (incomingDrivers) {
        const persisted = await deps.driversService.saveDrivers({
          carrierId,
          hasAdditionalDrivers,
          drivers: incomingDrivers,
        });

        const mergedDrivers = incomingDrivers.map((incomingDriver, index) => {
          const persistedDriver = persisted[index];
          return {
            ...incomingDriver,
            id: persistedDriver?.id ?? incomingDriver.id,
          };
        });

        // Strip the legacy `entries` key so we don't double-store; future
        // hydrations should always read from `drivers`.
        const { entries: _drop, ...rest } = input.answers as Record<
          string,
          Prisma.InputJsonValue
        >;
        normalizedAnswers = {
          ...rest,
          drivers: mergedDrivers as unknown as Prisma.InputJsonValue,
        };
      }
    }

    const mergedAnswers: Record<string, Prisma.InputJsonValue> = {
      ...(existingAnswers as Record<string, Prisma.InputJsonValue>),
      [input.stepId]: normalizedAnswers,
    };

    const completed = session.completedStepIds ?? [];
    const completedStepIds = completed.includes(input.stepId)
      ? completed
      : [...completed, input.stepId];

    const updated = await deps.sessionRepo.update(session.id, {
      answers: mergedAnswers,
      currentStepId: input.stepId,
      completedStepIds,
      lastActiveAt: new Date(),
    });
    deps.logger.info('Onboarding step submitted', {
      carrierId,
      stepId: input.stepId,
      sessionId: session.id,
    });

    return updated;
  },
});
