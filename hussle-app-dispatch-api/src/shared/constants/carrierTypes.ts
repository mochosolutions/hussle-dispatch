/**
 * Carrier type constants — derived from the CarrierType Prisma enum.
 */
export const CARRIER_TYPES = Object.freeze({
  COMPANY_ASSET: 'COMPANY_ASSET',
  LEASED_CARRIER: 'LEASED_CARRIER',
  EXTERNAL_CARRIER: 'EXTERNAL_CARRIER',
} as const);

export type CarrierType = (typeof CARRIER_TYPES)[keyof typeof CARRIER_TYPES];
