import type { Driver, Load } from '@prisma/client';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import type {
  ActiveLoadSummary,
  DriverDetailResponse,
  DriverResponse,
} from '../../types/driverTypes';

type DriverWithCarrier = Driver & {
  carrier?: { name: string } | null;
};

type DriverWithLoads = DriverWithCarrier & {
  loads?: Load[];
};

const toActiveLoadSummary = (load: Load): ActiveLoadSummary => ({
  id: load.id,
  loadNumber: load.loadNumber,
  status: load.status,
  equipmentType: load.equipmentType,
  commodity: load.commodity,
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
