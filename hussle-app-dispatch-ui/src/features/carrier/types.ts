// Derived from fleet-management API contract (openapi spec)
// Decimal fields are represented as string (API serializes Decimal as string)

export type CarrierType = 'COMPANY_ASSET' | 'OWNER_OPERATOR' | 'EXTERNAL_CARRIER';

export type CarrierStatus = 'approved' | 'pending' | 'suspended' | 'draft';

export type InsuranceWarning = '30_DAY' | '7_DAY' | 'EXPIRED' | null;

export type VehicleType =
  | 'DRY_VAN'
  | 'REEFER'
  | 'FLATBED'
  | 'STEP_DECK'
  | 'BOX_TRUCK'
  | 'HOTSHOT'
  | 'POWER_ONLY';

export type VehicleOwnership = 'OWNED' | 'LEASED';

export type VehicleExpenseCategory = 'FIXED' | 'VARIABLE' | 'SERVICE' | 'WAGE' | 'DEDUCTION';

export interface VehicleExpense {
  id: string;
  vehicleId: string;
  category: VehicleExpenseCategory;
  expenseKey: string;
  label: string;
  monthlyAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertVehicleExpense {
  category: VehicleExpenseCategory;
  expenseKey: string;
  label: string;
  monthlyAmount?: number;
}

export type ContactType = 'BROKER' | 'SHIPPER' | 'CONSIGNEE' | 'FACTORING';

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

export interface DriverPreferredLane {
  originState: string;
  destState: string;
  originCity: string | null;
  destCity: string | null;
}

export interface DriverNoGoZone {
  state: string;
  city: string | null;
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
  isAvailable: boolean;
  status: string;
  homeBaseCity: string | null;
  homeBaseState: string | null;
  availableHours: string | null;
  currentCity: string | null;
  currentState: string | null;
  maxDaysOut: number | null;
  preferredLanes: DriverPreferredLane[];
  noGoZones: DriverNoGoZone[];
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
  isAvailable?: boolean;
  status?: string;
  homeBaseCity?: string | null;
  homeBaseState?: string | null;
  availableHours?: string | null;
  currentCity?: string | null;
  currentState?: string | null;
  maxDaysOut?: number | null;
  preferredLanes?: DriverPreferredLane[] | null;
  noGoZones?: DriverNoGoZone[] | null;
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
  isAvailable?: boolean;
  status?: string;
  homeBaseCity?: string | null;
  homeBaseState?: string | null;
  availableHours?: string | null;
  currentCity?: string | null;
  currentState?: string | null;
  maxDaysOut?: number | null;
  preferredLanes?: DriverPreferredLane[] | null;
  noGoZones?: DriverNoGoZone[] | null;
  notes?: string | null;
}

export interface Vehicle {
  id: string;
  carrierId: string | null;
  driverId: string | null;
  unitNumber: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  licensePlate: string | null;
  licensePlateState: string | null;
  type: VehicleType;
  ownership: VehicleOwnership;
  isActive: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  warrantyInfo: string | null;
  monthlyGrossTarget: string | null;
  monthlyMilesTarget: number | null;
  workingDaysPerMonth: number | null;
  expenses: VehicleExpense[];
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
  ownership?: VehicleOwnership;
  isActive?: boolean;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  warrantyInfo?: string | null;
  monthlyGrossTarget?: string | null;
  monthlyMilesTarget?: number | null;
  workingDaysPerMonth?: number | null;
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
  ownership?: VehicleOwnership;
  isActive?: boolean;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  warrantyInfo?: string | null;
  monthlyGrossTarget?: string | null;
  monthlyMilesTarget?: number | null;
  workingDaysPerMonth?: number | null;
  expenses?: UpsertVehicleExpense[];
  notes?: string | null;
}

export interface Contact {
  id: string;
  companyName: string;
  contactName: string | null;
  type: ContactType;
  mcNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  paymentTerms: string;
  paymentTermsDays: number;
  quickPayDiscount: string | null;
  carrierPacketSentAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateContactInput {
  companyName: string;
  contactName?: string | null;
  type: ContactType;
  mcNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  paymentTerms?: string;
  paymentTermsDays?: number;
  quickPayDiscount?: string | null;
  carrierPacketSentAt?: string | null;
  notes?: string | null;
}

export interface UpdateContactInput {
  companyName?: string;
  contactName?: string | null;
  type?: ContactType;
  mcNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  paymentTerms?: string;
  paymentTermsDays?: number;
  quickPayDiscount?: string | null;
  carrierPacketSentAt?: string | null;
  notes?: string | null;
}

export interface CarrierNote {
  id: string;
  carrierId: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface CreateCarrierNoteInput {
  content: string;
}

export type LookupStatus = 'idle' | 'searching' | 'found' | 'not_found';

export type CreateMode = 'full' | 'quick';

export type SubmitStatus = 'active' | 'pending';

/**
 * Temporary form-state representation of a vehicle during carrier creation.
 * Converted to CreateVehicleInput on API submission.
 */
export interface VehicleFormEntry {
  localId: string;
  unitNumber: string;
  type: VehicleType;
  make: string;
  model: string;
  /** String for input binding; converted to number on API submit. */
  year: string;
  vin: string;
  licensePlate: string;
}

/**
 * Temporary form-state representation of a driver during carrier creation.
 * Converted to CreateDriverInput on API submission.
 */
export interface DriverFormEntry {
  localId: string;
  firstName: string;
  lastName: string;
  phone: string;
  cdlNumber: string;
  cdlExpiry: string;
  email: string;
}
