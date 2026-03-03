import type { Carrier, CarrierType, LoadStatus } from '@prisma/client';
import type { SortOrder } from '@/shared/pagination';
import type { PaginationMeta } from '@/shared/responseEnvelope';

export interface CreateCarrierInput {
  name: string;
  type: CarrierType;
  mcNumber?: string;
  dotNumber?: string;
  ein?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dispatchFeePercent?: string | number;
  partnerSplitPercent?: string | number;
  feeIncludesAccessorials?: boolean;
  ownerOpPayPercent?: string | number;
  dispatchAgreementOnFile?: boolean;
  dispatchAgreementSignedAt?: Date;
  insuranceCertOnFile?: boolean;
  insuranceExpiry?: Date;
  w9OnFile?: boolean;
  carrierPacketOnFile?: boolean;
  onboardingFlowId?: string;
  onboardingStatus?: string;
  authorityStatus?: string;
  status?: string;
  notes?: string;
}

export interface UpdateCarrierInput {
  name?: string;
  type?: CarrierType;
  mcNumber?: string;
  dotNumber?: string;
  ein?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dispatchFeePercent?: string | number;
  partnerSplitPercent?: string | number;
  feeIncludesAccessorials?: boolean;
  ownerOpPayPercent?: string | number;
  dispatchAgreementOnFile?: boolean;
  dispatchAgreementSignedAt?: Date;
  insuranceCertOnFile?: boolean;
  insuranceExpiry?: Date;
  w9OnFile?: boolean;
  carrierPacketOnFile?: boolean;
  onboardingFlowId?: string;
  onboardingStatus?: string;
  authorityStatus?: string;
  status?: string;
  notes?: string;
}

export interface CarrierListFilters {
  type?: CarrierType;
  search?: string;
}

export type InsuranceWarning = '30_DAY' | '7_DAY' | 'EXPIRED';

export interface CarrierWithCounts extends Carrier {
  _count: {
    drivers: number;
    vehicles: number;
  };
}

export interface CarrierResponse extends Omit<Carrier, 'partnerSplitPercent'> {
  driverCount: number;
  vehicleCount: number;
  onboardingComplete: boolean;
  insuranceWarning: InsuranceWarning | null;
  partnerSplitPercent?: Carrier['partnerSplitPercent'];
}

export interface CarrierQueryInput {
  organizationId: string;
  filters: CarrierListFilters;
}

export interface ListCarriersRepositoryInput extends CarrierQueryInput {
  skip: number;
  take: number;
  orderBy: Record<string, SortOrder>;
}

export interface CarrierRepositoryPort {
  create(organizationId: string, input: CreateCarrierInput): Promise<CarrierWithCounts>;
  findById(id: string, organizationId: string): Promise<CarrierWithCounts | null>;
  list(input: ListCarriersRepositoryInput): Promise<CarrierWithCounts[]>;
  count(input: CarrierQueryInput): Promise<number>;
  update(id: string, input: UpdateCarrierInput): Promise<CarrierWithCounts>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
}

export interface LoadRepositoryPort {
  findBlockingLoadIds(carrierId: string, statuses: LoadStatus[], limit: number): Promise<string[]>;
}

export interface ListCarriersResult {
  data: CarrierWithCounts[];
  meta: PaginationMeta;
}
