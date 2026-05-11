import { CarrierStatus } from '@prisma/client';
import { InvalidTransitionError } from '@/shared/errors';

const ALLOWED_TRANSITIONS: Record<CarrierStatus, readonly CarrierStatus[]> = {
  DRAFT: [CarrierStatus.INVITED],
  INVITED: [CarrierStatus.ONBOARDING, CarrierStatus.REJECTED, CarrierStatus.ACTIVE],
  ONBOARDING: [CarrierStatus.PENDING_APPROVAL, CarrierStatus.REJECTED, CarrierStatus.ACTIVE],
  PENDING_APPROVAL: [CarrierStatus.ACTIVE, CarrierStatus.REJECTED],
  REJECTED: [CarrierStatus.INVITED, CarrierStatus.ACTIVE],
  ACTIVE: [CarrierStatus.ACTION_REQUIRED, CarrierStatus.SUSPENDED],
  ACTION_REQUIRED: [CarrierStatus.ACTIVE, CarrierStatus.SUSPENDED],
  SUSPENDED: [CarrierStatus.ACTIVE, CarrierStatus.ACTION_REQUIRED],
};

export const isAllowedTransition = (from: CarrierStatus, to: CarrierStatus): boolean =>
  ALLOWED_TRANSITIONS[from].includes(to);

export const assertTransition = (from: CarrierStatus, to: CarrierStatus): void => {
  if (!isAllowedTransition(from, to)) {
    throw new InvalidTransitionError(from, to, [...ALLOWED_TRANSITIONS[from]]);
  }
};

export const allowedTransitionsFrom = (from: CarrierStatus): readonly CarrierStatus[] =>
  ALLOWED_TRANSITIONS[from];
