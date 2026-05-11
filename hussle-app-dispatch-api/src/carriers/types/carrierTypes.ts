import type {
  Carrier,
  CarrierStatus,
  CarrierType,
  LoadStatus,
  Driver,
  BillingMethod,
  FactoringSubmission,
  EmailMode,
  DispatchFeeType,
} from '@prisma/client';
import type { SortOrder } from '@/shared/pagination';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import type { CreateDriverInput } from '@/drivers/types/driverTypes';
import type { CreateVehicleInput, VehicleWithExpenses } from '@/vehicles/types/vehicleTypes';

export interface CreateCarrierInput {
  name: string;
  type: CarrierType;
  carrierOrgId?: string;
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
  dispatchFeeType?: DispatchFeeType;
  dispatchFeeAmount?: string | number;
  partnerSplitPercent?: string | number;
  feeIncludesAccessorials?: boolean;
  ownerOpPayPercent?: string | number;
  dispatchAgreementOnFile?: boolean;
  dispatchAgreementSignedAt?: Date;
  insuranceCertOnFile?: boolean;
  insuranceExpiry?: Date;
  w9OnFile?: boolean;
  carrierPacketOnFile?: boolean;
  authorityStatus?: string;
  status?: CarrierStatus;
  description?: string;
  primaryContactId?: string;
  billingMethod?: BillingMethod;
  factoringCompanyName?: string;
  factoringCompanyEmail?: string;
  factoringSubmissionMethod?: FactoringSubmission;
  factoringAdvanceRate?: string | number;
  factoringFeePercent?: string | number;
  factoringNoa?: string;
  outboundEmailMode?: EmailMode;
  replyToEmail?: string;
}

export interface CreateCarrierWithAssetsInput extends CreateCarrierInput {
  drivers?: Omit<CreateDriverInput, 'carrierId'>[];
  vehicles?: Omit<CreateVehicleInput, 'carrierId'>[];
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
  dispatchFeeType?: DispatchFeeType;
  dispatchFeeAmount?: string | number;
  partnerSplitPercent?: string | number;
  feeIncludesAccessorials?: boolean;
  ownerOpPayPercent?: string | number;
  dispatchAgreementOnFile?: boolean;
  dispatchAgreementSignedAt?: Date;
  insuranceCertOnFile?: boolean;
  insuranceExpiry?: Date;
  w9OnFile?: boolean;
  carrierPacketOnFile?: boolean;
  authorityStatus?: string;
  status?: CarrierStatus;
  description?: string;
  primaryContactId?: string;
  billingMethod?: BillingMethod;
  factoringCompanyName?: string;
  factoringCompanyEmail?: string;
  factoringSubmissionMethod?: FactoringSubmission;
  factoringAdvanceRate?: string | number;
  factoringFeePercent?: string | number;
  factoringNoa?: string;
  outboundEmailMode?: EmailMode;
  replyToEmail?: string;
  inviteSentAt?: Date;
  entryMethod?: string;
}

export interface CarrierListFilters {
  type?: CarrierType;
  status?: CarrierStatus[];
  search?: string;
}

export type InsuranceWarning = '30_DAY' | '7_DAY' | 'EXPIRED';

export interface PrimaryContactInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export interface CarrierOnboardingSessionSummary {
  lastActiveAt: Date;
  currentPhase: number;
  completedPhases: number[];
  completedAt: Date | null;
}

export interface CarrierWithCounts extends Carrier {
  _count: {
    drivers: number;
    vehicles: number;
  };
  primaryContact: PrimaryContactInfo | null;
  onboardingSession: CarrierOnboardingSessionSummary | null;
}

export interface CarrierWithAssets extends CarrierWithCounts {
  drivers: Driver[];
  vehicles: VehicleWithExpenses[];
}

export interface CarrierServiceOutput extends Omit<Carrier, 'partnerSplitPercent'> {
  driverCount: number;
  vehicleCount: number;
  onboardingComplete: boolean;
  insuranceWarning: InsuranceWarning | null;
  onboardingSession: CarrierOnboardingSessionSummary | null;
  partnerSplitPercent?: Carrier['partnerSplitPercent'];
}

export interface CarrierWithAssetsServiceOutput extends CarrierServiceOutput {
  drivers: Driver[];
  vehicles: VehicleWithExpenses[];
}

export interface CarrierResponse extends Omit<Carrier, 'partnerSplitPercent'> {
  organizationId: string;
  driverCount: number;
  vehicleCount: number;
  onboardingComplete: boolean;
  insuranceWarning: InsuranceWarning | null;
  onboardingSession: CarrierOnboardingSessionSummary | null;
  partnerSplitPercent?: Carrier['partnerSplitPercent'];
}

export interface CarrierWithAssetsResponse extends CarrierResponse {
  drivers: Driver[];
  vehicles: VehicleWithExpenses[];
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
  createWithAssets(
    organizationId: string,
    payload: {
      carrier: CreateCarrierInput;
      drivers?: Omit<CreateDriverInput, 'carrierId'>[];
      vehicles?: Omit<CreateVehicleInput, 'carrierId'>[];
    },
  ): Promise<CarrierWithAssets>;
  findById(id: string, organizationId: string): Promise<CarrierWithCounts | null>;
  list(input: ListCarriersRepositoryInput): Promise<CarrierWithCounts[]>;
  count(input: CarrierQueryInput): Promise<number>;
  update(id: string, organizationId: string, input: UpdateCarrierInput): Promise<CarrierWithCounts>;
  softDelete(id: string, organizationId: string, deletedAt: Date): Promise<void>;
}

export interface LoadRepositoryPort {
  findBlockingLoadIds(carrierId: string, statuses: readonly LoadStatus[], limit: number): Promise<string[]>;
}

export interface ListCarriersResult {
  data: CarrierWithCounts[];
  meta: PaginationMeta;
}

export interface ListCarriersServiceResult {
  data: CarrierServiceOutput[];
  meta: PaginationMeta;
}

export interface CarrierNoteInput {
  text: string;
  authorId?: string;
  authorName?: string;
}

export interface CarrierNoteResponse {
  id: string;
  carrierId: string;
  text: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: Date;
}

export interface CarrierNoteRepositoryPort {
  createNote(carrierId: string, input: CarrierNoteInput): Promise<CarrierNoteResponse>;
  listNotes(carrierId: string, skip: number, take: number): Promise<CarrierNoteResponse[]>;
  countNotes(carrierId: string): Promise<number>;
}
