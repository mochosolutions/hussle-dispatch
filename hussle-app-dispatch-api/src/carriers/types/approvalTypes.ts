import type { CarrierStatus, OnboardingStatus } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

export interface CarrierForApproval {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  managedByOrgId: string;
  onboardingStatus: OnboardingStatus;
  status: CarrierStatus;
  minimumRatePerMile: Decimal | null;
}

export interface CarrierApproved {
  id: string;
  status: CarrierStatus;
  onboardingStatus: OnboardingStatus;
  minimumRatePerMile: Decimal | null;
}

export interface CarrierRejected {
  id: string;
  onboardingStatus: OnboardingStatus;
}

export interface CarrierApprovalPort {
  findById(id: string, organizationId: string): Promise<CarrierForApproval | null>;
  approve(id: string): Promise<CarrierApproved>;
  reject(id: string): Promise<CarrierRejected>;
}
