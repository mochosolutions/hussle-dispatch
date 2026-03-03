// Derived from hussle-app-dispatch-api/prisma/schema.prisma
// Decimal fields are represented as string (API serializes Prisma Decimal as string)

export interface Carrier {
  id: string;
  managedByOrgId: string;
  carrierOrgId: string | null;
  name: string;
  type: 'COMPANY_ASSET' | 'OWNER_OPERATOR' | 'EXTERNAL_CARRIER';
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
  partnerSplitPercent: string;
  feeIncludesAccessorials: boolean;
  ownerOpPayPercent: string | null;
  dispatchAgreementOnFile: boolean;
  dispatchAgreementSignedAt: string | null;
  insuranceCertOnFile: boolean;
  insuranceExpiry: string | null;
  w9OnFile: boolean;
  carrierPacketOnFile: boolean;
  onboardingFlowId: string | null;
  onboardingStatus: string | null;
  authorityStatus: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  driverCount: number;
  vehicleCount: number;
}

export interface CreateCarrierInput {
  managedByOrgId: string;
  name: string;
  type: 'COMPANY_ASSET' | 'OWNER_OPERATOR' | 'EXTERNAL_CARRIER';
  mcNumber?: string | null;
  dotNumber?: string | null;
  ein?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  dispatchFeePercent?: string;
  partnerSplitPercent?: string;
  feeIncludesAccessorials?: boolean;
  ownerOpPayPercent?: string | null;
  dispatchAgreementOnFile?: boolean;
  insuranceCertOnFile?: boolean;
  insuranceExpiry?: string | null;
  w9OnFile?: boolean;
  carrierPacketOnFile?: boolean;
  status?: string;
  notes?: string | null;
}

// UpdateCarrierInput is a partial of CreateCarrierInput — type alias avoids empty-interface lint error
export type UpdateCarrierInput = Partial<CreateCarrierInput>;

export interface Driver {
  id: string;
  carrierId: string;
  name: string;
  phone: string | null;
  email: string | null;
  cdlNumber: string | null;
  cdlState: string | null;
  cdlExpiry: string | null;
  availableHours: string | null;
  currentCity: string | null;
  currentState: string | null;
  homeBaseCity: string | null;
  homeBaseState: string | null;
  maxDaysOut: number | null;
  preferredLanes: unknown;
  noGoZones: unknown;
  isAvailable: boolean;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Vehicle {
  id: string;
  carrierId: string;
  unitNumber: string;
  type: string;
  ownership: 'OWNED' | 'LEASED';
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  licensePlate: string | null;
  licensePlateState: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  warrantyInfo: string | null;
  monthlyGrossTarget: string | null;
  monthlyMilesTarget: number | null;
  workingDaysPerMonth: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TruckExpense {
  id: string;
  vehicleId: string;
  category: string;
  expenseKey: string;
  label: string;
  monthlyAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  organizationId: string;
  type: 'BROKER' | 'SHIPPER' | 'CONSIGNEE' | 'FACTORING';
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  mcNumber: string | null;
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
