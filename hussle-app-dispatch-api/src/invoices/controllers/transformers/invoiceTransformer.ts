import type { InvoiceWithRelations, InvoiceListItem } from '../../types/invoiceTypes';

interface AccessorialItemResponse {
  id: string;
  type: string;
  description: string | null;
  amount: string;
}

interface StopResponse {
  id: string;
  type: string;
  sequence: number;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  appointmentStart: string | null;
  appointmentEnd: string | null;
}

interface InvoiceDetailResponse {
  id: string;
  loadId: string;
  carrierId: string | null;
  customerId: string | null;
  invoiceNumber: string;
  type: string;
  subtotal: string;
  accessorials: string;
  totalAmount: string;
  paymentTerms: string;
  paymentTermsDays: number;
  dueDate: string;
  missingSignedBol: boolean;
  status: string;
  sentAt: string | null;
  sentTo: string | null;
  paidAt: string | null;
  paidAmount: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  approvedAt: string | null;
  pdfUrl: string | null;
  billingMethod: string | null;
  deliveryMethod: string | null;
  sentToEmail: string | null;
  factoringAdvance: string | null;
  factoringFeeAmount: string | null;
  reserveAmount: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  accessorialItems: AccessorialItemResponse[];
  load: {
    id: string;
    loadNumber: string;
    status: string;
    stops: StopResponse[];
  };
  carrier: {
    id: string;
    name: string;
    mcNumber: string | null;
    phone: string | null;
  } | null;
  customer: {
    id: string;
    companyName: string;
  } | null;
}

export const toInvoiceDetailResponse = (
  invoice: InvoiceWithRelations,
): InvoiceDetailResponse => ({
  id: invoice.id,
  loadId: invoice.loadId,
  carrierId: invoice.carrierId,
  customerId: invoice.customerId,
  invoiceNumber: invoice.invoiceNumber,
  type: invoice.type,
  subtotal: String(invoice.subtotal),
  accessorials: String(invoice.accessorials),
  totalAmount: String(invoice.totalAmount),
  paymentTerms: invoice.paymentTerms,
  paymentTermsDays: invoice.paymentTermsDays,
  dueDate: invoice.dueDate.toISOString(),
  missingSignedBol: invoice.missingSignedBol,
  status: invoice.status,
  sentAt: invoice.sentAt?.toISOString() ?? null,
  sentTo: invoice.sentTo,
  paidAt: invoice.paidAt?.toISOString() ?? null,
  paidAmount: invoice.paidAmount !== null ? String(invoice.paidAmount) : null,
  paymentMethod: invoice.paymentMethod,
  paymentReference: invoice.paymentReference,
  approvedAt: invoice.approvedAt?.toISOString() ?? null,
  pdfUrl: invoice.pdfUrl,
  billingMethod: invoice.billingMethod,
  deliveryMethod: invoice.deliveryMethod,
  sentToEmail: invoice.sentToEmail,
  factoringAdvance: invoice.factoringAdvance !== null ? String(invoice.factoringAdvance) : null,
  factoringFeeAmount: invoice.factoringFeeAmount !== null ? String(invoice.factoringFeeAmount) : null,
  reserveAmount: invoice.reserveAmount !== null ? String(invoice.reserveAmount) : null,
  notes: invoice.notes,
  createdAt: invoice.createdAt.toISOString(),
  updatedAt: invoice.updatedAt.toISOString(),
  accessorialItems: invoice.load.accessorialCharges.map((charge) => ({
    id: charge.id,
    type: charge.type,
    description: charge.description,
    amount: String(charge.amount),
  })),
  load: {
    id: invoice.load.id,
    loadNumber: invoice.load.loadNumber,
    status: invoice.load.status,
    stops: invoice.load.stops.map((stop) => ({
      id: stop.id,
      type: stop.type,
      sequence: stop.sequence,
      facilityName: stop.facilityName,
      city: stop.city,
      state: stop.state,
      appointmentStart: stop.appointmentStart?.toISOString() ?? null,
      appointmentEnd: stop.appointmentEnd?.toISOString() ?? null,
    })),
  },
  carrier: invoice.carrier !== null
    ? {
        id: invoice.carrier.id,
        name: invoice.carrier.name,
        mcNumber: invoice.carrier.mcNumber,
        phone: invoice.carrier.phone,
      }
    : null,
  customer: invoice.customer !== null
    ? { id: invoice.customer.id, companyName: invoice.customer.companyName }
    : null,
});

interface InvoiceListItemResponse {
  id: string;
  loadId: string;
  carrierId: string | null;
  customerId: string | null;
  invoiceNumber: string;
  type: string;
  subtotal: string;
  accessorials: string;
  totalAmount: string;
  paymentTerms: string;
  paymentTermsDays: number;
  dueDate: string;
  missingSignedBol: boolean;
  status: string;
  sentAt: string | null;
  paidAt: string | null;
  paidAmount: string | null;
  approvedAt: string | null;
  createdAt: string;
  load: { id: string; loadNumber: string; status: string };
  carrier: { id: string; name: string } | null;
  customer: { id: string; companyName: string } | null;
}

export const toInvoiceListResponse = (
  items: InvoiceListItem[],
): InvoiceListItemResponse[] =>
  items.map((item) => ({
    id: item.id,
    loadId: item.loadId,
    carrierId: item.carrierId,
    customerId: item.customerId,
    invoiceNumber: item.invoiceNumber,
    type: item.type,
    subtotal: String(item.subtotal),
    accessorials: String(item.accessorials),
    totalAmount: String(item.totalAmount),
    paymentTerms: item.paymentTerms,
    paymentTermsDays: item.paymentTermsDays,
    dueDate: item.dueDate.toISOString(),
    missingSignedBol: item.missingSignedBol,
    status: item.status,
    sentAt: item.sentAt?.toISOString() ?? null,
    paidAt: item.paidAt?.toISOString() ?? null,
    paidAmount: item.paidAmount !== null ? String(item.paidAmount) : null,
    approvedAt: item.approvedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    load: item.load,
    carrier: item.carrier,
    customer: item.customer,
  }));
