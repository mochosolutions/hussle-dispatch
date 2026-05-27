import { randomUUID } from 'crypto';
import type { StagedLoad } from '../types/loadBoardTypes';
import type { SourceMapper } from './equipmentTypeMap';
import { mapRelayEquipment } from './equipmentTypeMap';
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
  const payout = num(get(raw, ['payout', 'value']));
  const totalMiles = get(raw, ['totalDistance', 'value']) !== undefined
    ? (num(get(raw, ['totalDistance', 'value'])) !== null
        ? Math.round(num(get(raw, ['totalDistance', 'value'])) as number)
        : null)
    : null;

  const ratePerMile =
    payout !== null && totalMiles !== null && totalMiles > 0
      ? Math.round((payout / totalMiles) * 100) / 100
      : null;

  const deadheadRaw = get(raw, ['deadhead', 'value']);
  const deadheadMiles = deadheadRaw !== undefined && deadheadRaw !== null
    ? Math.round(Number(deadheadRaw))
    : null;

  const loads = get(raw, ['loads']);
  const firstLoad = Array.isArray(loads) ? loads[0] : undefined;

  const loadDistanceRaw = firstLoad !== undefined
    ? get(firstLoad as Record<string, unknown>, ['distance', 'value'])
    : undefined;
  const loadedMiles = loadDistanceRaw !== undefined && loadDistanceRaw !== null
    ? Math.round(Number(loadDistanceRaw))
    : null;

  const equipmentTypeRaw = firstLoad !== undefined
    ? str(get(firstLoad as Record<string, unknown>, ['equipmentType']))
    : null;
  const equipmentType = equipmentTypeRaw !== null
    ? mapRelayEquipment(equipmentTypeRaw)
    : null;

  const commodity = firstLoad !== undefined
    ? str(get(firstLoad as Record<string, unknown>, ['commodity']))
    : null;

  const loadType = firstLoad !== undefined
    ? str(get(firstLoad as Record<string, unknown>, ['loadType']))
    : null;

  const totalDurationRaw = raw.totalDuration;
  const totalDuration = totalDurationRaw !== undefined && totalDurationRaw !== null
    ? Math.round(Number(totalDurationRaw) / 60000)
    : null;

  const aggregatedCostItems = raw.aggregatedCostItems;
  let costBreakdown: Record<string, number> | null = null;
  if (Array.isArray(aggregatedCostItems)) {
    costBreakdown = {};
    aggregatedCostItems.forEach((item: unknown) => {
      if (
        item !== null &&
        typeof item === 'object' &&
        'name' in (item as Record<string, unknown>) &&
        'value' in (item as Record<string, unknown>)
      ) {
        const itemRecord = item as Record<string, unknown>;
        const name = str(itemRecord.name);
        const value = num(itemRecord.value);
        if (name !== null && value !== null) {
          (costBreakdown as Record<string, number>)[name] = value;
        }
      }
    });
    if (Object.keys(costBreakdown).length === 0) {
      costBreakdown = null;
    }
  }

  const tags = Array.isArray(raw.tags) ? (raw.tags as string[]) : null;

  return {
    id: randomUUID(),
    source: 'relay' as const,
    sourceId: String(raw.id ?? ''),
    payout,
    totalMiles,
    ratePerMile,
    deadheadMiles,
    loadedMiles,
    equipmentTypeRaw,
    equipmentType,
    commodity,
    isTeamDriver: raw.transitOperatorType === 'TEAM',
    workType: str(raw.workType),
    loadType,
    totalDuration,
    firstPickupTime: str(raw.firstPickupTime),
    lastDeliveryTime: str(raw.lastDeliveryTime),
    originCity: str(get(raw, ['startLocation', 'city'])),
    originState: str(get(raw, ['startLocation', 'state'])),
    originLat: num(get(raw, ['startLocation', 'latitude'])),
    originLng: num(get(raw, ['startLocation', 'longitude'])),
    destCity: str(get(raw, ['endLocation', 'city'])),
    destState: str(get(raw, ['endLocation', 'state'])),
    destLat: num(get(raw, ['endLocation', 'latitude'])),
    destLng: num(get(raw, ['endLocation', 'longitude'])),
    stopCount: raw.stopCount !== undefined && raw.stopCount !== null
      ? Number(raw.stopCount)
      : null,
    costBreakdown,
    tags,
    rawData: truncateRawData(raw),
    ingestedAt: new Date().toISOString(),
  };
};

export const createRelayMapper = (): SourceMapper => ({
  mapLoads: (rawLoads) => rawLoads.map((raw) => mapLoad(raw)),
});
