import type { InvoiceStatus, InvoiceType } from './types';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  VOID: 'Void',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: '#757575',
  APPROVED: '#1976d2',
  SENT: '#0288d1',
  PARTIALLY_PAID: '#ed6c02',
  PAID: '#2e7d32',
  VOID: '#d32f2f',
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  carrier: 'Carrier',
  broker: 'Broker',
};

export const INVOICE_STATUS_OPTIONS: InvoiceStatus[] = [
  'DRAFT',
  'APPROVED',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'VOID',
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'ACH', label: 'ACH' },
  { value: 'CHECK', label: 'Check' },
  { value: 'WIRE', label: 'Wire Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'OTHER', label: 'Other' },
];
