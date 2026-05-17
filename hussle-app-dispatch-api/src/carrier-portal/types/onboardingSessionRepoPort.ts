import type { OnboardingSession, Prisma } from '@prisma/client';

export interface OnboardingSessionUpdateData {
  currentPhase?: number;
  currentQuestionIndex?: number;
  currentStepId?: string | null;
  completedStepIds?: string[];
  answers?: Prisma.InputJsonValue;
  completedPhases?: number[];
  lastActiveAt?: Date;
  completedAt?: Date;
}

export interface OnboardingSessionRepoPort {
  findByCarrierId(carrierId: string): Promise<OnboardingSession | null>;
  create(data: { carrierId: string }): Promise<OnboardingSession>;
  update(id: string, data: OnboardingSessionUpdateData): Promise<OnboardingSession>;
}
