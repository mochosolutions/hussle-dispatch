/**
 * Accessorial charge type constants — derived from the AccessorialType Prisma enum.
 */
export const ACCESSORIAL_TYPES = [
  'DETENTION',
  'LUMPER',
  'TONU',
  'LAYOVER',
  'DRIVER_ASSIST',
  'FUEL_SURCHARGE',
  'TARP',
  'TOLL',
  'OTHER',
] as const;

export type AccessorialType = (typeof ACCESSORIAL_TYPES)[number];
