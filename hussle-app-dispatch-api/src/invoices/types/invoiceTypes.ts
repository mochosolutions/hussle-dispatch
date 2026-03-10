import type {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  Load,
  Carrier,
  AccessorialCharge,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export interface InvoiceWithRelations extends Invoice {
  load: Load;
  carrier: Carrier | null;
}

export interface InvoiceListItem {
  id: string;
  loadId: string;
  carrierId: string | null;
  invoiceNumber: string;
  type: InvoiceType;
  subtotal: unknown; // Decimal
  accessorials: unknown; // Decimal
  totalAmount: unknown; // Decimal
  paymentTerms: string;
  dueDate: Date;
  missingSignedBol: boolean;
  status: InvoiceStatus;
  sentAt: Date | null;
  paidAt: Date | null;
  paidAmount: unknown | null; // Decimal
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
}

// ---------------------------------------------------------------------------
// Create / Update inputs
// ---------------------------------------------------------------------------

export interface CreateInvoiceInput {
  loadId: string;
  carrierId?: string;
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
  findById(id: string): Promise<InvoiceWithRelations | null>;
  findByLoadId(loadId: string): Promise<InvoiceWithRelations | null>;
  findAll(
    organizationId: string,
    filters: InvoiceListFilters,
  ): Promise<InvoiceListItem[]>;
  update(id: string, data: UpdateInvoiceInput): Promise<InvoiceWithRelations>;
  updateStatus(
    id: string,
    status: InvoiceStatus,
    extra?: Record<string, unknown>,
  ): Promise<InvoiceWithRelations>;
  delete(id: string): Promise<void>;
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
    vehicleId: string | null;
    customerRate: unknown | null; // Decimal
    carrierRate: unknown | null; // Decimal
    dispatchFee: unknown | null; // Decimal
    bolSignedAt: Date | null;
    status: string;
    carrier: {
      id: string;
      name: string;
      type: string;
    } | null;
    broker: {
      id: string;
      paymentTerms: string;
      paymentTermsDays: number;
    } | null;
    accessorialCharges: AccessorialCharge[];
  } | null>;
  updateLoadStatus(loadId: string, status: string): Promise<void>;
}
