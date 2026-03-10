import type { InvoiceStatus, InvoiceType } from '@prisma/client';
import type {
  InvoiceWithRelations,
  InvoiceListItem,
  InvoiceListFilters,
  UpdateInvoiceInput,
} from './invoiceTypes';

// ---------------------------------------------------------------------------
// Service input types
// ---------------------------------------------------------------------------

export interface ListInvoicesServiceInput {
  organizationId: string;
  role: string;
  filters: InvoiceListFilters;
}

export interface GetInvoiceByIdServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface UpdateInvoiceServiceInput {
  id: string;
  organizationId: string;
  role: string;
  input: UpdateInvoiceInput;
}

export interface DeleteInvoiceServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface ApproveInvoiceServiceInput {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
}

export interface SendInvoiceServiceInput {
  id: string;
  organizationId: string;
  role: string;
  email: string;
}

export interface MarkPaidServiceInput {
  id: string;
  organizationId: string;
  role: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface InvoiceService {
  listInvoices(input: ListInvoicesServiceInput): Promise<InvoiceListItem[]>;
  getInvoiceById(input: GetInvoiceByIdServiceInput): Promise<InvoiceWithRelations>;
  updateInvoice(input: UpdateInvoiceServiceInput): Promise<InvoiceWithRelations>;
  deleteInvoice(input: DeleteInvoiceServiceInput): Promise<void>;
  approveInvoice(input: ApproveInvoiceServiceInput): Promise<InvoiceWithRelations>;
  sendInvoice(input: SendInvoiceServiceInput): Promise<InvoiceWithRelations>;
  markPaid(input: MarkPaidServiceInput): Promise<InvoiceWithRelations>;
}
