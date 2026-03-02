/**
 * Contact type constants — derived from the ContactType Prisma enum.
 */
export const CONTACT_TYPES = ['BROKER', 'SHIPPER', 'CONSIGNEE', 'FACTORING'] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];
