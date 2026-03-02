/**
 * Load status constants — all 14 possible states for a load's lifecycle.
 * Derived from the LoadStatus Prisma enum.
 */
export const LOAD_STATUSES = [
  'QUOTED',
  'BOOKED',
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
  'INVOICE_PENDING',
  'INVOICED',
  'PAID',
  'EXCEPTION',
  'CANCELED',
  'TONU',
] as const;

export type LoadStatus = (typeof LOAD_STATUSES)[number];
