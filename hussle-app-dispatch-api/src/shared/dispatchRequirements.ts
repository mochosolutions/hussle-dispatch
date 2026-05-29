import { EquipmentType } from '@prisma/client';

export type DispatchTier = 'hard' | 'silentAdmin' | 'explicitAdmin';

export interface DispatchViolation {
  code: string;
  message: string;
  field?: string;
  tier: DispatchTier;
  metadata?: Record<string, unknown>;
}

const humanizeEquipment = (value: string): string => value.replace(/_/g, ' ').toLowerCase();

// load equipment type -> vehicle types that can satisfy it. 'ANY' = no check.
const COMPATIBLE_VEHICLE_TYPES: Record<EquipmentType, EquipmentType[] | 'ANY'> = {
  BOX_TRUCK: [EquipmentType.BOX_TRUCK, EquipmentType.DRY_VAN, EquipmentType.REEFER],
  DRY_VAN: [EquipmentType.DRY_VAN, EquipmentType.REEFER],
  REEFER: [EquipmentType.REEFER],
  FLATBED: [EquipmentType.FLATBED, EquipmentType.STEP_DECK],
  STEP_DECK: [EquipmentType.STEP_DECK],
  HOTSHOT: [EquipmentType.HOTSHOT],
  POWER_ONLY: 'ANY',
};

export const checkEquipmentCompatibility = (input: {
  loadEquipmentType: EquipmentType | null;
  vehicleType: EquipmentType;
}): DispatchViolation | null => {
  const { loadEquipmentType, vehicleType } = input;
  if (loadEquipmentType === null) {
    return null;
  }
  const allowed = COMPATIBLE_VEHICLE_TYPES[loadEquipmentType];
  if (allowed === 'ANY' || allowed.includes(vehicleType)) {
    return null;
  }
  return {
    code: 'EQUIPMENT_MISMATCH',
    field: 'vehicleId',
    tier: 'explicitAdmin',
    message: `Vehicle equipment (${humanizeEquipment(vehicleType)}) can't haul a ${humanizeEquipment(loadEquipmentType)} load.`,
    metadata: { loadEquipmentType, vehicleType },
  };
};

export const checkDriverLicense = (input: {
  licenseExpiry: Date | null;
  now?: Date;
}): DispatchViolation | null => {
  const now = input.now ?? new Date();
  if (input.licenseExpiry !== null && input.licenseExpiry < now) {
    return {
      code: 'DRIVER_LICENSE_EXPIRED',
      field: 'driverId',
      tier: 'explicitAdmin',
      message: `Driver's license expired on ${input.licenseExpiry.toISOString().slice(0, 10)}.`,
      metadata: { licenseExpiry: input.licenseExpiry.toISOString() },
    };
  }
  return null;
};
