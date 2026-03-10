// ---------------------------------------------------------------------------
// Invoice store & API types
// ---------------------------------------------------------------------------

export type InvoiceStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'VOID';

export type InvoiceType = 'carrier' | 'broker';

export type PaymentMethod = 'ACH' | 'CHECK' | 'WIRE' | 'CREDIT_CARD' | 'OTHER';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceAccessorial {
  id: string;
  description: string;
  amount: number;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  loadId: string | null;
  loadNumber: string | null;
  carrierId: string | null;
  carrierName: string | null;
  subtotal: number;
  accessorialsTotal: number;
  grandTotal: number;
  dueDate: string;
  missingBol: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetail extends InvoiceListItem {
  invoiceDate: string;
  paymentTerms: string;
  billTo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    email?: string;
  } | null;
  lineItems: InvoiceLineItem[];
  accessorials: InvoiceAccessorial[];
  notes: string | null;
  recipientEmail: string | null;
  paidAmount: number;
  payments: InvoicePayment[];
}

export interface InvoicePayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  createdAt: string;
}

export interface PaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
}

export interface SendInvoiceInput {
  recipientEmail: string;
}

export interface UpdateInvoiceInput {
  notes?: string;
  dueDate?: string;
  paymentTerms?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  type?: InvoiceType;
  overdue?: boolean;
  missingBol?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
