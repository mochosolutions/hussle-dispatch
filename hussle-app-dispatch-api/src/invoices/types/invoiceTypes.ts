import type { Prisma } from '@prisma/client';
import type {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  Load,
  Carrier,
  Customer,
  AccessorialCharge,
  StopType,
  DispatchFeeType,
  DriverPayType,
  DispatcherCommType,
  CarrierType,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export interface InvoiceDetailStop {
  id: string;
  type: StopType;
  sequence: number;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  appointmentStart: Date | null;
  appointmentEnd: Date | null;
}

export interface InvoiceWithRelations extends Invoice {
  load: Load & {
    accessorialCharges: AccessorialCharge[];
    stops: InvoiceDetailStop[];
    organization: { id: string; name: string };
  };
  carrier: Carrier | null;
  customer: Customer | null;
}

export interface InvoiceListItem {
  id: string;
  loadId: string;
  carrierId: string | null;
  customerId: string | null;
  invoiceNumber: string;
  type: InvoiceType;
  subtotal: unknown; // Decimal
  accessorials: unknown; // Decimal
  totalAmount: unknown; // Decimal
  paymentTerms: string;
  paymentTermsDays: number;
  dueDate: Date;
  missingSignedBol: boolean;
  status: InvoiceStatus;
  sentAt: Date | null;
  paidAt: Date | null;
  paidAmount: unknown | null; // Decimal
  approvedAt: Date | null;
  createdAt: Date;
  load: {
    id: string;
    loadNumber: string;
    status: string;
  };
  carrier: {
    id: string;
    name: string;
  } | null;
  customer: {
    id: string;
    companyName: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Create / Update inputs
// ---------------------------------------------------------------------------

export interface CreateInvoiceInput {
  loadId: string;
  carrierId?: string;
  customerId?: string;
  invoiceNumber: string;
  type: InvoiceType;
  subtotal: number;
  accessorials: number;
  totalAmount: number;
  paymentTerms: string;
  paymentTermsDays: number;
  dueDate: Date;
  missingSignedBol: boolean;
  notes?: string;
}

export interface UpdateInvoiceInput {
  subtotal?: number;
  accessorials?: number;
  totalAmount?: number;
  paymentTerms?: string;
  paymentTermsDays?: number;
  dueDate?: Date;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface InvoiceListFilters {
  status?: InvoiceStatus[];
  type?: InvoiceType;
  overdue?: boolean;
  missingBol?: boolean;
}

// ---------------------------------------------------------------------------
// Repo port
// ---------------------------------------------------------------------------

export interface InvoiceRepoPort {
  create(data: CreateInvoiceInput): Promise<InvoiceWithRelations>;
  findById(id: string, organizationId: string): Promise<InvoiceWithRelations | null>;
  findByLoadId(loadId: string, organizationId: string): Promise<InvoiceWithRelations | null>;
  findAll(
    organizationId: string,
    filters: InvoiceListFilters,
  ): Promise<InvoiceListItem[]>;
  update(id: string, organizationId: string, data: UpdateInvoiceInput): Promise<InvoiceWithRelations>;
  updateStatus(
    id: string,
    organizationId: string,
    status: InvoiceStatus,
    extra?: Record<string, unknown>,
  ): Promise<InvoiceWithRelations>;
  findManyByLoadId(loadId: string, organizationId: string): Promise<InvoiceWithRelations[]>;
  delete(id: string, organizationId: string): Promise<void>;
  countByStatus(organizationId: string, status: string): Promise<number>;
  findNonVoidByLoadId(loadId: string, organizationId: string): Promise<InvoiceWithRelations | null>;
}

// ---------------------------------------------------------------------------
// Load query port (for invoice service to read load data)
// ---------------------------------------------------------------------------

export interface InvoiceLoadQueryPort {
  findLoadById(
    loadId: string,
  ): Promise<{
    id: string;
    organizationId: string;
    loadNumber: string;
    carrierId: string | null;
    customerId: string | null;
    vehicleId: string | null;
    customerRate: Prisma.Decimal | null;
    carrierRate: Prisma.Decimal | null;
    dispatchFeeType: DispatchFeeType | null;
    dispatchFeeAmount: Prisma.Decimal | null;
    // US-11b: snapshot inputs required to compute dispatchFee on read.
    loadedMiles: number | null;
    totalMiles: number | null;
    partnerSplitPercent: Prisma.Decimal | null;
    driverPayType: DriverPayType | null;
    driverPayRate: Prisma.Decimal | null;
    dispatcherCommissionType: DispatcherCommType | null;
    dispatcherCommissionRate: Prisma.Decimal | null;
    feeIncludesAccessorials: boolean | null;
    payFromNet: boolean | null;
    carrierType: CarrierType | null;
    bolSignedAt: Date | null;
    status: string;
    contact: {
      id: string;
      email: string | null;
    } | null;
    carrier: {
      id: string;
      name: string;
      type: string;
      billingMethod: string;
      dispatchFeeType: DispatchFeeType;
      dispatchFeePercent: unknown; // Decimal
      dispatchFeeAmount: unknown; // Decimal
      feeIncludesAccessorials: boolean;
      primaryContact: {
        id: string;
        email: string | null;
      } | null;
    } | null;
    customer: {
      id: string;
      email: string | null;
      paymentTerms: string | null;
      paymentTermsDays: number;
      billingMethod: string;
    } | null;
    accessorialCharges: AccessorialCharge[];
  } | null>;
  updateLoadStatus(loadId: string, status: string): Promise<void>;
  findLoadWithStops(loadId: string): Promise<{
    id: string;
    organizationId: string;
    loadNumber: string;
    externalRefNumber: string | null;
    equipmentType: string | null;
    totalMiles: number | null;
    customerRate: unknown | null;
    carrierRate: unknown | null;
    status: string;
    carrier: {
      id: string;
      name: string;
      type: string;
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      phone: string | null;
      email: string | null;
      mcNumber: string | null;
      billingMethod: string;
      factoringCompanyName: string | null;
      factoringCompanyEmail: string | null;
      factoringSubmissionMethod: string | null;
      factoringAdvanceRate: unknown | null;
      factoringFeePercent: unknown | null;
      factoringNoa: string | null;
      outboundEmailMode: string;
      replyToEmail: string | null;
    } | null;
    customer: {
      id: string;
      companyName: string;
      email: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      paymentTerms: string | null;
      paymentTermsDays: number;
    } | null;
    stops: {
      type: string;
      sequence: number;
      facilityName: string | null;
      city: string | null;
      state: string | null;
      appointmentStart: Date | null;
      appointmentEnd: Date | null;
      arrivalTime: Date | null;
      departureTime: Date | null;
      commodity: string | null;
      weight: number | null;
      pieceCount: number | null;
      isHazmat: boolean;
      isTarp: boolean;
    }[];
    accessorialCharges: {
      id: string;
      type: string;
      description: string | null;
      amount: unknown;
      approvalStatus: string;
    }[];
  } | null>;
}
