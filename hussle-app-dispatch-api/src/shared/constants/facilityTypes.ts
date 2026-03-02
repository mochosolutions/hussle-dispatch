/**
 * Facility type constants — derived from the FacilityType Prisma enum.
 */
export const FACILITY_TYPES = [
  'WAREHOUSE',
  'DISTRIBUTION_CENTER',
  'CROSS_DOCK',
  'COLD_STORAGE',
  'PORT',
  'RAIL_YARD',
  'TRUCK_STOP',
  'DROP_YARD',
  'MANUFACTURING',
  'RETAIL',
  'FARM',
  'CONSTRUCTION_SITE',
  'MILITARY',
  'GOVERNMENT',
  'RESIDENTIAL',
  'OTHER',
] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

/**
 * Dock type constants — derived from the DockType Prisma enum.
 */
export const DOCK_TYPES = ['DOCK_HIGH', 'GROUND_LEVEL', 'BOTH', 'NONE'] as const;

export type DockType = (typeof DOCK_TYPES)[number];
