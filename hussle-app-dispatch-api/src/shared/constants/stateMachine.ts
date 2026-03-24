import type { LoadStatus } from './loadStatuses';

/**
 * Transitions that only ADMIN role may execute.
 */
export const ADMIN_ONLY_TRANSITIONS: readonly LoadStatus[] = Object.freeze([
  'EXCEPTION',
  'PAID',
] as const);

/**
 * Transitions that only DRIVER role may execute (the driver progress chain).
 */
export const DRIVER_ALLOWED_TRANSITIONS: readonly LoadStatus[] = Object.freeze([
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
] as const);

/**
 * Transitions that require a notes field to be provided.
 */
export const NOTES_REQUIRED_TRANSITIONS: readonly LoadStatus[] = Object.freeze([
  'EXCEPTION',
  'CANCELED',
] as const);
