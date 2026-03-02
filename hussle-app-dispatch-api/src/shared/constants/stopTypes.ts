/**
 * Stop type constants — derived from the StopType Prisma enum.
 */
export const STOP_TYPES = [
  'PICKUP',
  'DELIVERY',
  'STOP_OFF',
  'DROP_HOOK',
  'LIVE_UNLOAD',
] as const;

export type StopType = (typeof STOP_TYPES)[number];
