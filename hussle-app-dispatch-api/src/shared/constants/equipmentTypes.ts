/**
 * Equipment type constants — derived from the EquipmentType Prisma enum.
 */
export const EQUIPMENT_TYPES = [
  'DRY_VAN',
  'REEFER',
  'FLATBED',
  'STEP_DECK',
  'BOX_TRUCK',
  'HOTSHOT',
  'POWER_ONLY',
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];
