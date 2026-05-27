import type { ChipColor } from 'types/chipColor';
import type { InvoiceStatus, InvoiceType } from './types';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  VOID: 'Void',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, ChipColor> = {
  DRAFT: 'default',
  APPROVED: 'info',
  SENT: 'primary',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  VOID: 'default',
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  CUSTOMER: 'Customer',
  DISPATCH_FEE: 'Dispatch Fee',
};

export const INVOICE_STATUS_OPTIONS: InvoiceStatus[] = [
  'DRAFT',
  'APPROVED',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'VOID',
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'ACH', label: 'ACH' },
  { value: 'CHECK', label: 'Check' },
  { value: 'WIRE', label: 'Wire Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'OTHER', label: 'Other' },
];
