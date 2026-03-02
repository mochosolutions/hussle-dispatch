/**
 * Document type constants — derived from the DocumentType Prisma enum.
 */
export const DOCUMENT_TYPES = [
  'BROKER_RATE_CON',
  'BOL_UNSIGNED',
  'BOL_SIGNED',
  'DISPATCH_AGREEMENT',
  'INSURANCE_CERT',
  'W9',
  'CARRIER_PACKET',
  'INVOICE',
  'LUMPER_RECEIPT',
  'SCALE_TICKET',
  'OTHER',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
