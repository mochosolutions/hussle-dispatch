// Derived from fleet-management API contract (openapi spec)

export type CarrierType = 'COMPANY_ASSET' | 'EXTERNAL_CARRIER' | 'LEASED_CARRIER';

export type CarrierStatus =
  | 'DRAFT'
  | 'INVITED'
  | 'ONBOARDING'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'ACTIVE'
  | 'ACTION_REQUIRED'
  | 'SUSPENDED';

export interface CarrierOnboardingSessionSummary {
  lastActiveAt: string;
  currentPhase: number;
  completedPhases: number[];
  completedAt: string | null;
}

export type InsuranceWarning = '30_DAY' | '7_DAY' | 'EXPIRED' | null;

export type DispatchFeeType = 'PERCENTAGE' | 'FLAT';

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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface DispatchableStatus {
  ready: boolean;
  missing: string[];
}

export interface Carrier {
  id: string;
  name: string;
  type: CarrierType;
  status: CarrierStatus;
  mcNumber: string | null;
  dotNumber: string | null;
  ein: string | null;
  phone: string | null;
  email: string | null;
  primaryContactName: string | null;
  primaryContactPhone: string | null;
  primaryContactEmail: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  companyMarginPercent: number;
  dispatchFeeType: DispatchFeeType;
  dispatchFeeAmount: number;
  feeIncludesAccessorials: boolean;
  dispatchAgreementOnFile: boolean;
  insuranceCertOnFile: boolean;
  insuranceExpiry: string | null;
  insuranceWarning: InsuranceWarning;
  w9OnFile: boolean;
  carrierPacketOnFile: boolean;
  billingMethod: string;
  factoringCompanyName: string | null;
  factoringCompanyEmail: string | null;
  factoringSubmissionMethod: string | null;
  factoringAdvanceRate: string | null;
  factoringFeePercent: string | null;
  factoringNoa: string | null;
  outboundEmailMode: string;
  replyToEmail: string | null;
  notes: string | null;
  dispatchableStatus: DispatchableStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CarrierListItem extends Carrier {
  driverCount: number;
  vehicleCount: number;
  onboardingComplete: boolean;
  onboardingSession: CarrierOnboardingSessionSummary | null;
  inviteSentAt: string | null;
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
  lat?: number | null;
  lng?: number | null;
  companyMarginPercent?: number | null;
  dispatchFeeType?: DispatchFeeType | null;
  dispatchFeeAmount?: number | null;
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
  lat?: number | null;
  lng?: number | null;
  companyMarginPercent?: number | null;
  dispatchFeeType?: DispatchFeeType | null;
  dispatchFeeAmount?: number | null;
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

export type DriverLicenseType = 'CLASS_D' | 'CLASS_M' | 'CDL_A' | 'CDL_B' | 'CDL_C';

export type DriverPayType = 'PERCENTAGE' | 'PER_MILE' | 'PER_HOUR' | 'FLAT_RATE';

export const DRIVER_LICENSE_TYPE_OPTIONS: Array<{
  value: DriverLicenseType;
  label: string;
  shortLabel: string;
}> = [
  { value: 'CLASS_D', label: 'Standard (Class D)', shortLabel: 'Class D' },
  { value: 'CLASS_M', label: 'Motorcycle (Class M)', shortLabel: 'Class M' },
  { value: 'CDL_A', label: 'CDL Class A', shortLabel: 'CDL-A' },
  { value: 'CDL_B', label: 'CDL Class B', shortLabel: 'CDL-B' },
  { value: 'CDL_C', label: 'CDL Class C', shortLabel: 'CDL-C' },
];

export type EndorsementCode = 'H' | 'N' | 'X' | 'T' | 'P' | 'S';

export const ENDORSEMENT_OPTIONS: Array<{ value: EndorsementCode; label: string }> = [
  { value: 'H', label: 'Hazmat' },
  { value: 'N', label: 'Tanker' },
  { value: 'X', label: 'Hazmat + Tanker' },
  { value: 'T', label: 'Double/Triple Trailers' },
  { value: 'P', label: 'Passenger' },
  { value: 'S', label: 'School Bus' },
];

export interface Driver {
  id: string;
  carrierId: string | null;
  carrierName?: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  licenseType: DriverLicenseType;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiry: string | null;
  endorsements: EndorsementCode[] | null;
  isAvailable: boolean;
  status: string;
  homeBaseCity: string | null;
  homeBaseState: string | null;
  availableHours: string | null;
  currentCity: string | null;
  currentState: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  maxDaysOut: number | null;
  preferredLanes: DriverPreferredLane[];
  noGoZones: DriverNoGoZone[];
  payType: DriverPayType | null;
  payRate: string | null;
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
  licenseType?: DriverLicenseType;
  licenseNumber?: string | null;
  licenseState?: string | null;
  licenseExpiry?: string | null;
  endorsements?: EndorsementCode[] | null;
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
  payType?: DriverPayType | null;
  payRate?: number | null;
  notes?: string | null;
}

export interface UpdateDriverInput {
  carrierId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  licenseType?: DriverLicenseType;
  licenseNumber?: string | null;
  licenseState?: string | null;
  licenseExpiry?: string | null;
  endorsements?: EndorsementCode[] | null;
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
  payType?: DriverPayType | null;
  payRate?: number | null;
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
  activeLoadCount?: number;
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

export type UpdateVehicleInput = {
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
};

export interface Contact {
  id: string;
  organizationId: string;
  customerId: string | null;
  role: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  ccEmails: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateContactInput {
  customerId?: string | null;
  role?: string | null;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  ccEmails?: string[];
  notes?: string | null;
}

export interface UpdateContactInput {
  customerId?: string | null;
  role?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  ccEmails?: string[];
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

export type SubmitStatus = 'ACTIVE' | 'PENDING';

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
  licenseNumber: string;
  licenseExpiry: string;
  email: string;
}
