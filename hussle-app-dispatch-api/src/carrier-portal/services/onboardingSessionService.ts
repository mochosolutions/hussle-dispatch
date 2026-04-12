import type { Carrier, OnboardingSession, Prisma } from '@prisma/client';
import type {
  OnboardingSessionRepoPort,
  OnboardingSessionUpdateData,
} from '../types/onboardingSessionRepoPort';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { NotFoundError, ValidationError } from '@/shared/errors/commonErrors';

const TOTAL_PHASES = 6;

interface CarrierRepoPort {
  findById(id: string): Promise<Carrier | null>;
  update(id: string, data: Record<string, unknown>): Promise<Carrier>;
}

interface OnboardingSessionServiceDeps {
  sessionRepo: OnboardingSessionRepoPort;
  carrierRepo: CarrierRepoPort;
  eventBus: EventBus;
  logger: Logger;
}

export interface SaveAnswerInput {
  questionId: string;
  value: Prisma.InputJsonValue;
  phase?: number;
}

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

    const session = await deps.sessionRepo.create({ carrierId });

    const carrier = await deps.carrierRepo.findById(carrierId);
    if (carrier && carrier.onboardingStatus === 'NOT_STARTED') {
      await deps.carrierRepo.update(carrierId, { onboardingStatus: 'IN_PROGRESS' });
      deps.logger.info('Carrier onboarding status set to IN_PROGRESS', { carrierId });
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

    const updated = await deps.sessionRepo.update(session.id, {
      completedAt: new Date(),
    });

    await deps.carrierRepo.update(carrierId, { onboardingStatus: 'COMPLETED' });

    const carrier = await deps.carrierRepo.findById(carrierId);
    const carrierName = carrier?.name ?? 'Unknown';
    const organizationId = carrier?.managedByOrgId ?? '';

    await deps.eventBus.publish('carrier.onboarding.completed', {
      carrierId,
      organizationId,
      carrierName,
    });

    deps.logger.info('Onboarding completed', { carrierId, sessionId: session.id });

    return updated;
  },
});
