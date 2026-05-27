import { randomUUID } from 'crypto';
import type { StagedLoad } from '../types/loadBoardTypes';
import type { SourceMapper } from './equipmentTypeMap';
import { mapDatEquipment } from './equipmentTypeMap';
import { truncateRawData } from './truncateRawData';

const get = (obj: unknown, path: string[]): unknown => {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

const num = (val: unknown): number | null => {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
};

const str = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;
  return String(val);
};

const mapLoad = (raw: Record<string, unknown>): StagedLoad => {
  const payout = num(get(raw, ['rate']));
  const totalMiles = num(get(raw, ['tripMiles']));

  const ratePerMile =
    payout !== null && totalMiles !== null && totalMiles > 0
      ? Math.round((payout / totalMiles) * 100) / 100
      : null;

  const equipmentTypeRaw = str(get(raw, ['equipmentTypeCode']));
  const equipmentType = equipmentTypeRaw !== null
    ? mapDatEquipment(equipmentTypeRaw)
    : null;

  const sourceIdRaw = str(get(raw, ['matchId']));
  const sourceId = sourceIdRaw !== null ? sourceIdRaw : randomUUID();

  return {
    id: randomUUID(),
    source: 'dat' as const,
    sourceId,
    payout,
    totalMiles,
    ratePerMile,
    deadheadMiles: null,
    loadedMiles: null,
    equipmentTypeRaw,
    equipmentType,
    commodity: null,
    isTeamDriver: false,
    workType: null,
    loadType: null,
    totalDuration: null,
    firstPickupTime: str(get(raw, ['pickupDate'])),
    lastDeliveryTime: null,
    originCity: str(get(raw, ['origin', 'city'])),
    originState: str(get(raw, ['origin', 'state'])),
    originLat: num(get(raw, ['origin', 'latitude'])),
    originLng: num(get(raw, ['origin', 'longitude'])),
    destCity: str(get(raw, ['destination', 'city'])),
    destState: str(get(raw, ['destination', 'state'])),
    destLat: num(get(raw, ['destination', 'latitude'])),
    destLng: num(get(raw, ['destination', 'longitude'])),
    stopCount: null,
    costBreakdown: null,
    tags: null,
    rawData: truncateRawData(raw),
    ingestedAt: new Date().toISOString(),
  };
};

export const createDatMapper = (): SourceMapper => ({
  mapLoads: (rawLoads) => rawLoads.map((raw) => mapLoad(raw)),
});
