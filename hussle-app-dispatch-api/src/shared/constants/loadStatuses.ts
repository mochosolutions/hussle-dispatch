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

/**
 * Statuses that represent active, in-progress loads.
 * Used by driver and vehicle deletion to prevent removing assets with active loads.
 */
export const BLOCKING_DELETE_STATUSES: readonly LoadStatus[] = [
  'QUOTED',
  'BOOKED',
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
] as const;

/**
 * Statuses that block carrier deletion — all statuses except PAID.
 * Carriers cannot be deleted while any non-paid load exists.
 */
export const CARRIER_BLOCKING_DELETE_STATUSES: readonly LoadStatus[] = LOAD_STATUSES.filter(
  (status) => status !== 'PAID',
);
