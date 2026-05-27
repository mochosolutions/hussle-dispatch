import type { Driver, Load, Stop } from '@prisma/client';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import { computeCommoditySummary } from '@/shared/utils/computeCommoditySummary';
import type {
  ActiveLoadSummary,
  DriverDetailResponse,
  DriverResponse,
} from '../../types/driverTypes';

type LoadWithStops = Load & { stops: Stop[] };

type DriverWithCarrier = Driver & {
  carrier?: { name: string } | null;
};

type DriverWithLoads = DriverWithCarrier & {
  loads?: LoadWithStops[];
};

const toActiveLoadSummary = (load: LoadWithStops): ActiveLoadSummary => ({
  id: load.id,
  loadNumber: load.loadNumber,
  status: load.status,
  equipmentType: load.equipmentType,
  commodity: computeCommoditySummary(load.stops).commodity ?? null,
  customerRate: load.customerRate !== null ? String(load.customerRate) : null,
  totalMiles: load.totalMiles,
});

export const toDriverResponse = (driver: DriverWithCarrier): DriverResponse => ({
  ...driver,
  preferredLanes: driver.preferredLanes ?? [],
  noGoZones: driver.noGoZones ?? [],
  carrierName: driver.carrier?.name ?? null,
});

export const toDriverDetailResponse = (driver: DriverWithLoads): DriverDetailResponse => ({
  ...toDriverResponse(driver),
  activeLoads: (driver.loads ?? []).map(toActiveLoadSummary),
});

export const toDriverListResponse = (drivers: DriverWithCarrier[]): DriverResponse[] =>
  drivers.map((driver) => toDriverResponse(driver));

export const toDriverListEnvelope = (
  drivers: DriverWithCarrier[],
  meta: PaginationMeta,
): { data: DriverResponse[]; meta: PaginationMeta } => ({
  data: toDriverListResponse(drivers),
  meta,
});
