import type { CarrierStatus, CarrierType } from '@prisma/client';

export interface CarrierForSuspend {
  id: string;
  name: string;
  managedByOrgId: string;
  status: CarrierStatus;
  type: CarrierType;
  dispatchAgreementOnFile: boolean;
  insuranceCertOnFile: boolean;
  insuranceExpiry: Date | null;
  w9OnFile: boolean;
}

export interface CarrierSuspendPort {
  findById(id: string, organizationId: string): Promise<CarrierForSuspend | null>;
  setStatus(id: string, status: CarrierStatus): Promise<{ id: string; status: CarrierStatus }>;
}
