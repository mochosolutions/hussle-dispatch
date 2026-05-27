import type { EquipmentTypeApp, StagedLoad } from '../types/loadBoardTypes';

export const mapRelayEquipment = (raw: string): EquipmentTypeApp | null => {
  const upper = raw.toUpperCase();

  if (upper.includes('BOX_TRUCK')) return 'BOX_TRUCK';
  if (upper.includes('DRY_VAN')) return 'DRY_VAN';
  if (upper.includes('FIFTY_THREE') && upper.includes('TRUCK')) return 'DRY_VAN';
  if (upper.includes('CONTAINER')) return 'DRY_VAN';
  if (upper.includes('REEFER')) return 'REEFER';
  if (upper.includes('FROZEN')) return 'REEFER';
  if (upper.includes('AMBIENT')) return 'REEFER';
  if (upper.includes('FLATBED')) return 'FLATBED';

  return null;
};

export const DAT_EQUIPMENT_MAP: Record<string, EquipmentTypeApp> = {
  V: 'DRY_VAN',
  R: 'REEFER',
  F: 'FLATBED',
  SD: 'STEP_DECK',
  PO: 'POWER_ONLY',
  SB: 'BOX_TRUCK',
  HS: 'HOTSHOT',
};

export const mapDatEquipment = (code: string): EquipmentTypeApp | null =>
  DAT_EQUIPMENT_MAP[code] ?? null;

export interface SourceMapper {
  mapLoads(rawLoads: Record<string, unknown>[]): StagedLoad[];
}
