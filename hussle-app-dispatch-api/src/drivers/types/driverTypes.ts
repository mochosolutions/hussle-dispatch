import type { Driver, DriverLicenseType, DriverStatus, LoadStatus, Prisma } from '@prisma/client';
import type { PaginationMeta } from '@/shared/responseEnvelope';

export interface PreferredLaneInput {
  originState: string;
  destState: string;
  originCity?: string;
  destCity?: string;
}

export interface NoGoZoneInput {
  state: string;
  city?: string;
}

export interface CreateDriverInput {
  carrierId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  licenseType?: DriverLicenseType;
  cdlNumber?: string;
  cdlState?: string;
  cdlExpiry?: Date;
  availableHours?: string | number;
  currentCity?: string;
  currentState?: string;
  homeBaseCity?: string;
  homeBaseState?: string;
  maxDaysOut?: number;
  preferredLanes?: PreferredLaneInput[];
  noGoZones?: NoGoZoneInput[];
  isAvailable?: boolean;
  status?: DriverStatus;
  notes?: string;
}

export interface UpdateDriverInput {
  carrierId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  licenseType?: DriverLicenseType;
  cdlNumber?: string;
  cdlState?: string;
  cdlExpiry?: Date;
  availableHours?: string | number;
  currentCity?: string;
  currentState?: string;
  homeBaseCity?: string;
  homeBaseState?: string;
  maxDaysOut?: number;
  preferredLanes?: PreferredLaneInput[];
  noGoZones?: NoGoZoneInput[];
  isAvailable?: boolean;
  status?: DriverStatus;
  notes?: string;
}

export interface DriverListFilters {
  carrierId?: string;
  search?: string;
}

export interface DriverQueryInput {
  organizationId: string;
  filters: DriverListFilters;
}

export interface ListDriversRepositoryInput extends DriverQueryInput {
  skip: number;
  take: number;
  orderBy: Prisma.DriverOrderByWithRelationInput;
}

export interface DriverRepositoryPort {
  create(input: CreateDriverInput): Promise<Driver>;
  findById(id: string, organizationId: string): Promise<Driver | null>;
  list(input: ListDriversRepositoryInput): Promise<Driver[]>;
  count(input: DriverQueryInput): Promise<number>;
  update(id: string, input: UpdateDriverInput): Promise<Driver>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
}

export interface CarrierRepositoryPort {
  findActiveByIdForOrg(carrierId: string, organizationId: string): Promise<boolean>;
}

export interface LoadRepositoryPort {
  findBlockingLoadIdsByDriver(
    driverId: string,
    statuses: readonly LoadStatus[],
    limit: number,
  ): Promise<string[]>;
}

export interface ListDriversResult {
  data: Driver[];
  meta: PaginationMeta;
}

export interface ActiveLoadSummary {
  id: string;
  loadNumber: string;
  status: string;
  equipmentType: string | null;
  commodity: string | null;
  customerRate: string | null;
  totalMiles: number | null;
}

export type DriverResponse = Driver & {
  carrierName: string | null;
};

export type DriverDetailResponse = DriverResponse & {
  activeLoads: ActiveLoadSummary[];
};
