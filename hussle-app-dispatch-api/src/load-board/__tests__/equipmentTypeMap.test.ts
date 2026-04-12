import { mapRelayEquipment, mapDatEquipment } from '../mappers/equipmentTypeMap';

describe('mapRelayEquipment', () => {
  it('maps BOX_TRUCK_16_FOOT to BOX_TRUCK', () => {
    expect(mapRelayEquipment('BOX_TRUCK_16_FOOT')).toBe('BOX_TRUCK');
  });

  it('maps FIFTY_THREE_FOOT_DRY_VAN_TRUCK to DRY_VAN', () => {
    expect(mapRelayEquipment('FIFTY_THREE_FOOT_DRY_VAN_TRUCK')).toBe('DRY_VAN');
  });

  it('maps DRY_VAN to DRY_VAN', () => {
    expect(mapRelayEquipment('DRY_VAN')).toBe('DRY_VAN');
  });

  it('maps REEFER_TRAILER to REEFER', () => {
    expect(mapRelayEquipment('REEFER_TRAILER')).toBe('REEFER');
  });

  it('maps FROZEN_TRAILER to REEFER', () => {
    expect(mapRelayEquipment('FROZEN_TRAILER')).toBe('REEFER');
  });

  it('maps AMBIENT_VAN to REEFER', () => {
    expect(mapRelayEquipment('AMBIENT_VAN')).toBe('REEFER');
  });

  it('maps FLATBED_TRAILER to FLATBED', () => {
    expect(mapRelayEquipment('FLATBED_TRAILER')).toBe('FLATBED');
  });

  it('maps CONTAINER_40 to DRY_VAN', () => {
    expect(mapRelayEquipment('CONTAINER_40')).toBe('DRY_VAN');
  });

  it('returns null for UNKNOWN_TYPE', () => {
    expect(mapRelayEquipment('UNKNOWN_TYPE')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(mapRelayEquipment('flatbed_trailer')).toBe('FLATBED');
  });
});

describe('mapDatEquipment', () => {
  it('maps V to DRY_VAN', () => {
    expect(mapDatEquipment('V')).toBe('DRY_VAN');
  });

  it('maps R to REEFER', () => {
    expect(mapDatEquipment('R')).toBe('REEFER');
  });

  it('maps F to FLATBED', () => {
    expect(mapDatEquipment('F')).toBe('FLATBED');
  });

  it('maps SD to STEP_DECK', () => {
    expect(mapDatEquipment('SD')).toBe('STEP_DECK');
  });

  it('maps PO to POWER_ONLY', () => {
    expect(mapDatEquipment('PO')).toBe('POWER_ONLY');
  });

  it('maps SB to BOX_TRUCK', () => {
    expect(mapDatEquipment('SB')).toBe('BOX_TRUCK');
  });

  it('maps HS to HOTSHOT', () => {
    expect(mapDatEquipment('HS')).toBe('HOTSHOT');
  });

  it('returns null for unknown code XX', () => {
    expect(mapDatEquipment('XX')).toBeNull();
  });
});
