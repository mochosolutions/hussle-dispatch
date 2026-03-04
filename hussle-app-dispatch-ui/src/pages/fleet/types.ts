// Derived from fleet-management API contract (openapi spec)
// Decimal fields are represented as string (API serializes Decimal as string)

export type CarrierType = 'COMPANY_ASSET' | 'EXTERNAL_CARRIER';

export type InsuranceWarning = 'EXPIRING_SOON' | 'EXPIRED' | null;

export type DriverStatus = 'AVAILABLE' | 'ON_LOAD' | 'OFF_DUTY' | 'INACTIVE';

export type VehicleType = 'TRUCK' | 'TRAILER' | 'BOBTAIL';

export type VehicleStatus = 'AVAILABLE' | 'ON_LOAD' | 'IN_MAINTENANCE' | 'INACTIVE';

export type ContactType =
  | 'BROKER'
  | 'SHIPPER'
  | 'RECEIVER'
  | 'FACTORING_COMPANY'
  | 'FUEL_CARD_PROVIDER'
  | 'OTHER';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Carrier {
  id: string;
  name: string;
  type: CarrierType;
  mcNumber: string | null;
  dotNumber: string | null;
  ein: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dispatchFeePercent: string;
  partnerSplitPercent: string | null;
  feeIncludesAccessorials: boolean;
  dispatchAgreementOnFile: boolean;
  insuranceCertOnFile: boolean;
  insuranceExpiry: string | null;
  insuranceWarning: InsuranceWarning;
  w9OnFile: boolean;
  carrierPacketOnFile: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CarrierListItem extends Carrier {
  driverCount: number;
  vehicleCount: number;
  onboardingComplete: boolean;
}

export interface CarrierOnboardingStatus {
  carrierId: string;
  complete: boolean;
  dispatchAgreementOnFile: boolean;
  insuranceCertOnFile: boolean;
  w9OnFile: boolean;
  carrierPacketOnFile: boolean;
  insuranceExpiry: string | null;
  insuranceWarning: InsuranceWarning;
}

export interface CreateCarrierInput {
  name: string;
  type: CarrierType;
  mcNumber?: string | null;
  dotNumber?: string | null;
  ein?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  dispatchFeePercent?: string | null;
  partnerSplitPercent?: string | null;
  feeIncludesAccessorials?: boolean | null;
  dispatchAgreementOnFile?: boolean | null;
  insuranceCertOnFile?: boolean | null;
  w9OnFile?: boolean | null;
  carrierPacketOnFile?: boolean | null;
  insuranceExpiry?: string | null;
  notes?: string | null;
}

export interface UpdateCarrierInput {
  name?: string;
  mcNumber?: string | null;
  dotNumber?: string | null;
  ein?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  dispatchFeePercent?: string | null;
  partnerSplitPercent?: string | null;
  feeIncludesAccessorials?: boolean | null;
  dispatchAgreementOnFile?: boolean | null;
  insuranceCertOnFile?: boolean | null;
  w9OnFile?: boolean | null;
  carrierPacketOnFile?: boolean | null;
  insuranceExpiry?: string | null;
  notes?: string | null;
}

export interface Driver {
  id: string;
  carrierId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  cdlNumber: string | null;
  cdlState: string | null;
  cdlExpiry: string | null;
  status: DriverStatus;
  homeCity: string | null;
  homeState: string | null;
  preferredLanes: string[];
  noGoZones: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateDriverInput {
  carrierId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  cdlNumber?: string | null;
  cdlState?: string | null;
  cdlExpiry?: string | null;
  status?: DriverStatus;
  homeCity?: string | null;
  homeState?: string | null;
  preferredLanes?: string[] | null;
  noGoZones?: string[] | null;
  notes?: string | null;
}

export interface UpdateDriverInput {
  carrierId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  cdlNumber?: string | null;
  cdlState?: string | null;
  cdlExpiry?: string | null;
  status?: DriverStatus;
  homeCity?: string | null;
  homeState?: string | null;
  notes?: string | null;
}

export interface Vehicle {
  id: string;
  carrierId: string | null;
  unitNumber: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  licensePlate: string | null;
  licensePlateState: string | null;
  type: VehicleType;
  status: VehicleStatus;
  monthlyMilesTarget: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateVehicleInput {
  carrierId?: string | null;
  unitNumber: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
  licensePlate?: string | null;
  licensePlateState?: string | null;
  type: VehicleType;
  status: VehicleStatus;
  monthlyMilesTarget?: number | null;
  notes?: string | null;
}

export interface UpdateVehicleInput {
  carrierId?: string | null;
  unitNumber?: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
  licensePlate?: string | null;
  licensePlateState?: string | null;
  type?: VehicleType;
  status?: VehicleStatus;
  monthlyMilesTarget?: number | null;
  notes?: string | null;
}

export interface TruckExpense {
  id: string;
  vehicleId: string;
  category: string;
  amount: string;
  month: number;
  year: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTruckExpenseInput {
  category: string;
  amount: string;
  month: number;
  year: number;
  notes?: string | null;
}

export interface ReplaceTruckExpensesInput {
  month: number;
  year: number;
  expenses: CreateTruckExpenseInput[];
}

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateContactInput {
  name: string;
  type: ContactType;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
}

export interface UpdateContactInput {
  name?: string;
  type?: ContactType;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
}
