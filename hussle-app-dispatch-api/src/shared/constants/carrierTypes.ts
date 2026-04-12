/**
 * Carrier type constants — derived from the CarrierType Prisma enum.
 * Note: OWNER_OPERATOR exists in the data model but is rejected at runtime (decision X-001).
 */
export const CARRIER_TYPES = Object.freeze({
  COMPANY_ASSET: 'COMPANY_ASSET',
  LEASED_CARRIER: 'LEASED_CARRIER',
  OWNER_OPERATOR: 'OWNER_OPERATOR',
  EXTERNAL_CARRIER: 'EXTERNAL_CARRIER',
} as const);

export type CarrierType = (typeof CARRIER_TYPES)[keyof typeof CARRIER_TYPES];
