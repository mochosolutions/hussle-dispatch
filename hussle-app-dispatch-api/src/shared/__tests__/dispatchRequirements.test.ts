import { EquipmentType } from '@prisma/client';
import { checkDriverLicense, checkEquipmentCompatibility } from '../dispatchRequirements';

// ---------------------------------------------------------------------------
// checkEquipmentCompatibility
// ---------------------------------------------------------------------------

describe('checkEquipmentCompatibility', () => {
  it('returns null when a REEFER vehicle hauls a DRY_VAN load', () => {
    const result = checkEquipmentCompatibility({
      loadEquipmentType: EquipmentType.DRY_VAN,
      vehicleType: EquipmentType.REEFER,
    });

    expect(result).toBeNull();
  });

  it('returns null when a DRY_VAN vehicle hauls a BOX_TRUCK load', () => {
    const result = checkEquipmentCompatibility({
      loadEquipmentType: EquipmentType.BOX_TRUCK,
      vehicleType: EquipmentType.DRY_VAN,
    });

    expect(result).toBeNull();
  });

  it('returns EQUIPMENT_MISMATCH when a BOX_TRUCK vehicle is put on a DRY_VAN load', () => {
    const result = checkEquipmentCompatibility({
      loadEquipmentType: EquipmentType.DRY_VAN,
      vehicleType: EquipmentType.BOX_TRUCK,
    });

    expect(result).not.toBeNull();
    expect(result?.code).toBe('EQUIPMENT_MISMATCH');
    expect(result?.tier).toBe('explicitAdmin');
    expect(result?.field).toBe('vehicleId');
  });

  it('returns null when a STEP_DECK vehicle hauls a FLATBED load', () => {
    const result = checkEquipmentCompatibility({
      loadEquipmentType: EquipmentType.FLATBED,
      vehicleType: EquipmentType.STEP_DECK,
    });

    expect(result).toBeNull();
  });

  it('returns EQUIPMENT_MISMATCH when a FLATBED vehicle is put on a STEP_DECK load', () => {
    const result = checkEquipmentCompatibility({
      loadEquipmentType: EquipmentType.STEP_DECK,
      vehicleType: EquipmentType.FLATBED,
    });

    expect(result?.code).toBe('EQUIPMENT_MISMATCH');
  });

  it('returns null for a POWER_ONLY load regardless of vehicle type', () => {
    const result = checkEquipmentCompatibility({
      loadEquipmentType: EquipmentType.POWER_ONLY,
      vehicleType: EquipmentType.FLATBED,
    });

    expect(result).toBeNull();
  });

  it('returns null when the load has no equipment type', () => {
    const result = checkEquipmentCompatibility({
      loadEquipmentType: null,
      vehicleType: EquipmentType.BOX_TRUCK,
    });

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// checkDriverLicense
// ---------------------------------------------------------------------------

describe('checkDriverLicense', () => {
  it('returns DRIVER_LICENSE_EXPIRED when the license is expired', () => {
    const now = new Date('2026-05-28T00:00:00.000Z');
    const result = checkDriverLicense({
      licenseExpiry: new Date('2026-01-15T00:00:00.000Z'),
      now,
    });

    expect(result).not.toBeNull();
    expect(result?.code).toBe('DRIVER_LICENSE_EXPIRED');
    expect(result?.tier).toBe('explicitAdmin');
    expect(result?.field).toBe('driverId');
    expect(result?.message).toContain('2026-01-15');
  });

  it('returns null when the license expires in the future', () => {
    const now = new Date('2026-05-28T00:00:00.000Z');
    const result = checkDriverLicense({
      licenseExpiry: new Date('2027-01-15T00:00:00.000Z'),
      now,
    });

    expect(result).toBeNull();
  });

  it('returns null when the license has no expiry date', () => {
    const result = checkDriverLicense({ licenseExpiry: null });

    expect(result).toBeNull();
  });
});
