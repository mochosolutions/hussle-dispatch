import type { CarrierStatus } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

export interface CarrierForApproval {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  managedByOrgId: string;
  status: CarrierStatus;
  minimumRatePerMile: Decimal | null;
}

export interface CarrierApproved {
  id: string;
  status: CarrierStatus;
  minimumRatePerMile: Decimal | null;
}

export interface CarrierRejected {
  id: string;
  status: CarrierStatus;
}

export interface CarrierApprovalPort {
  findById(id: string, organizationId: string): Promise<CarrierForApproval | null>;
  setStatus(id: string, status: CarrierStatus): Promise<CarrierApproved>;
}
