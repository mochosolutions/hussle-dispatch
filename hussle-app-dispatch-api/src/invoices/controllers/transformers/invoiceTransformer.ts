import type { InvoiceWithRelations, InvoiceListItem } from '../../types/invoiceTypes';

interface InvoiceDetailResponse {
  id: string;
  loadId: string;
  carrierId: string | null;
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
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

export const toInvoiceDetailResponse = (
  invoice: InvoiceWithRelations,
): InvoiceDetailResponse => ({
  id: invoice.id,
  loadId: invoice.loadId,
  carrierId: invoice.carrierId,
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
  notes: invoice.notes,
  createdAt: invoice.createdAt.toISOString(),
  updatedAt: invoice.updatedAt.toISOString(),
  load: {
    id: invoice.load.id,
    loadNumber: invoice.load.loadNumber,
    status: invoice.load.status,
  },
  carrier: invoice.carrier !== null
    ? { id: invoice.carrier.id, name: invoice.carrier.name }
    : null,
});

interface InvoiceListItemResponse {
  id: string;
  loadId: string;
  carrierId: string | null;
  invoiceNumber: string;
  type: string;
  subtotal: string;
  accessorials: string;
  totalAmount: string;
  paymentTerms: string;
  dueDate: string;
  missingSignedBol: boolean;
  status: string;
  sentAt: string | null;
  paidAt: string | null;
  paidAmount: string | null;
  createdAt: string;
  load: { id: string; loadNumber: string; status: string };
  carrier: { id: string; name: string } | null;
}

export const toInvoiceListResponse = (
  items: InvoiceListItem[],
): InvoiceListItemResponse[] =>
  items.map((item) => ({
    id: item.id,
    loadId: item.loadId,
    carrierId: item.carrierId,
    invoiceNumber: item.invoiceNumber,
    type: item.type,
    subtotal: String(item.subtotal),
    accessorials: String(item.accessorials),
    totalAmount: String(item.totalAmount),
    paymentTerms: item.paymentTerms,
    dueDate: item.dueDate.toISOString(),
    missingSignedBol: item.missingSignedBol,
    status: item.status,
    sentAt: item.sentAt?.toISOString() ?? null,
    paidAt: item.paidAt?.toISOString() ?? null,
    paidAmount: item.paidAmount !== null ? String(item.paidAmount) : null,
    createdAt: item.createdAt.toISOString(),
    load: item.load,
    carrier: item.carrier,
  }));
