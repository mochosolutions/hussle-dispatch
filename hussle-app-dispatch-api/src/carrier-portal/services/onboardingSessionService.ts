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
import { LOCKS_FIELDS, companyFieldLockedPath } from '../constants/locksFields';

const TOTAL_PHASES = 6;

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

export interface SaveAnswerInput {
  questionId: string;
  value: Prisma.InputJsonValue;
  phase?: number;
}

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
}

const assertNoLockedFieldChange = ({
  stepId,
  incomingAnswers,
  existingAnswers,
  carrier,
}: AssertNoLockedFieldChangeInput): void => {
  if (!carrier || carrier.dispatchAgreementSignedAt === null) {
    return;
  }
  if (!isCompanyStep(stepId)) {
    return;
  }

  const existingStepAnswers = (existingAnswers[stepId] ?? {}) as Record<string, unknown>;
  for (const [questionId, incomingValue] of Object.entries(incomingAnswers)) {
    const dotPath = companyFieldLockedPath(questionId);
    if (!dotPath) continue;
    const existing = existingStepAnswers[questionId];
    const a = incomingValue === null ? null : String(incomingValue);
    const b = existing === null || existing === undefined ? null : String(existing);
    if (a !== b) {
      throw new FieldLockedError(dotPath);
    }
  }
};

// LOCKS_FIELDS is iterated by the parity test (see tests/locksFieldsParity.test.ts).
void LOCKS_FIELDS;

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

  saveAnswer: async (carrierId: string, input: SaveAnswerInput): Promise<OnboardingSession> => {
    const session = await deps.sessionRepo.findByCarrierId(carrierId);

    if (!session) {
      throw new NotFoundError(`Onboarding session for carrier ${carrierId} not found`);
    }

    const currentAnswers = (session.answers ?? {}) as Record<string, Prisma.InputJsonValue>;
    const mergedAnswers: Record<string, Prisma.InputJsonValue> = {
      ...currentAnswers,
      [input.questionId]: input.value,
    };

    const updateData: OnboardingSessionUpdateData = {
      answers: mergedAnswers,
      lastActiveAt: new Date(),
    };

    if (input.phase !== undefined) {
      updateData.currentPhase = input.phase;

      const completedPhases = session.completedPhases ?? [];
      if (!completedPhases.includes(input.phase)) {
        updateData.completedPhases = [...completedPhases, input.phase];
      }
    }

    const updated = await deps.sessionRepo.update(session.id, updateData);
    deps.logger.info('Onboarding answer saved', {
      carrierId,
      questionId: input.questionId,
      phase: input.phase,
    });

    return updated;
  },

  complete: async (carrierId: string): Promise<OnboardingSession> => {
    const session = await deps.sessionRepo.findByCarrierId(carrierId);

    if (!session) {
      throw new NotFoundError(`Onboarding session for carrier ${carrierId} not found`);
    }

    const completedPhases = session.completedPhases ?? [];
    const allPhases = Array.from({ length: TOTAL_PHASES }, (_, i) => i + 1);
    const missingPhases = allPhases.filter((phase) => !completedPhases.includes(phase));

    if (missingPhases.length > 0) {
      throw new ValidationError(
        'Cannot complete onboarding: not all phases are finished',
        missingPhases.map((phase) => `Phase ${phase} is incomplete`),
      );
    }

    const carrier = await deps.carrierRepo.findById(carrierId);
    const carrierName = carrier?.name ?? 'Unknown';

    if (carrier && carrier.type !== CARRIER_TYPES.COMPANY_ASSET) {
      const onboardingResult = checkCarrierOnboarding({
        carrierType: carrier.type,
        dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
        insuranceCertOnFile: carrier.insuranceCertOnFile,
        insuranceExpiry: carrier.insuranceExpiry,
        tinOnFile: carrier.tin !== null,
      });

      if (!onboardingResult.allowed) {
        throw new OnboardingBlockError(carrierName, onboardingResult.missingDocuments);
      }
    }

    const updated = await deps.sessionRepo.update(session.id, {
      completedAt: new Date(),
    });

    if (carrier) {
      assertTransition(carrier.status, CarrierStatus.PENDING_APPROVAL);
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

    const existingAnswers = (session.answers ?? {}) as Record<string, unknown>;
    assertNoLockedFieldChange({
      stepId: input.stepId,
      incomingAnswers: input.answers,
      existingAnswers,
      carrier,
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
    // Route drivers-list through portalDriversService for the same
    // reason. The UI ships drivers under `entries`; the persisted
    // entities (with real UUIDs) overlay back into `entries`.
    // ------------------------------------------------------------------
    if (input.stepId === 'drivers-list' && deps.driversService) {
      const incoming = input.answers as Record<string, unknown>;
      const incomingEntries = Array.isArray(incoming.entries)
        ? (incoming.entries as DriverEntry[])
        : null;
      const hasAdditionalDrivers =
        typeof incoming.hasAdditionalDrivers === 'boolean'
          ? incoming.hasAdditionalDrivers
          : Array.isArray(incomingEntries) && incomingEntries.length > 0;

      if (incomingEntries) {
        const persisted = await deps.driversService.saveDrivers({
          carrierId,
          hasAdditionalDrivers,
          drivers: incomingEntries,
        });

        const mergedEntries = incomingEntries.map((incomingDriver, index) => {
          const persistedDriver = persisted[index];
          return {
            ...incomingDriver,
            id: persistedDriver?.id ?? incomingDriver.id,
          };
        });

        normalizedAnswers = {
          ...(input.answers as Record<string, Prisma.InputJsonValue>),
          entries: mergedEntries as unknown as Prisma.InputJsonValue,
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
