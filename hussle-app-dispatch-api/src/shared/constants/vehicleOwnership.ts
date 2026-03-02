/**
 * Vehicle ownership constants — derived from the VehicleOwnership Prisma enum.
 */
export const VEHICLE_OWNERSHIP = Object.freeze({
  OWNED: 'OWNED',
  LEASED: 'LEASED',
} as const);

export type VehicleOwnershipType = (typeof VEHICLE_OWNERSHIP)[keyof typeof VEHICLE_OWNERSHIP];
