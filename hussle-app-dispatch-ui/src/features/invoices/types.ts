// ---------------------------------------------------------------------------
// Invoice store & API types
// ---------------------------------------------------------------------------

export type InvoiceStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID';

export type InvoiceType = 'CUSTOMER' | 'DISPATCH_FEE';

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

export interface InvoiceLoadStop {
  id: string;
  type: string;
  sequence: number;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  appointmentDate: string | null;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  load: {
    id: string;
    loadNumber: string;
    status: string;
    stops?: InvoiceLoadStop[];
  } | null;
  carrier: {
    id: string;
    name: string;
    mcNumber?: string | null;
    phone?: string | null;
  } | null;
  subtotal: string;
  accessorials: string;
  totalAmount: string;
  dueDate: string;
  missingSignedBol: boolean;
  createdAt: string;
  updatedAt: string;
  sentTo?: string | null;
  paidAmount?: string | null;
}

export interface InvoiceCounts {
  draft: number;
}

export interface InvoiceDetail extends InvoiceListItem {
  invoiceDate?: string;
  paymentTerms: string;
  paymentTermsDays?: number;
  approvedAt?: string;
  billTo?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    email?: string;
  } | null;
  lineItems?: InvoiceLineItem[];
  accessorialItems: InvoiceAccessorial[];
  notes: string | null;
  payments?: InvoicePayment[];
  pdfUrl: string | null;
  billingMethod: string | null;
  deliveryMethod: string | null;
  sentToEmail: string | null;
  factoringAdvance: string | null;
  factoringFeeAmount: string | null;
  reserveAmount: string | null;
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
  hasMore: boolean;
}
