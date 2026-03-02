/**
 * Invoice type constants — derived from the InvoiceType Prisma enum.
 */
export const INVOICE_TYPES = ['CUSTOMER', 'DISPATCH_FEE'] as const;

export type InvoiceType = (typeof INVOICE_TYPES)[number];

/**
 * Invoice status constants — derived from the InvoiceStatus Prisma enum.
 */
export const INVOICE_STATUSES = [
  'DRAFT',
  'APPROVED',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'VOID',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
