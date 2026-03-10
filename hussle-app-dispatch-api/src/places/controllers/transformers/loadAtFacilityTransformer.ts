import type { Load } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';
import type { PaginationMeta } from '@/shared/responseEnvelope';

const decimalToNumber = (value: Decimal | null): number | null => {
  if (value === null) {
    return null;
  }
  return value.toNumber();
};

export interface LoadAtFacilityResponse {
  id: string;
  organizationId: string;
  loadNumber: string;
  carrierId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  brokerId: string | null;
  shipperId: string | null;
  consigneeId: string | null;
  brokerRefNumber: string | null;
  equipmentType: string | null;
  commodity: string | null;
  weight: number | null;
  loadedMiles: number | null;
  totalMiles: number | null;
  customerRate: number | null;
  carrierRate: number | null;
  ratePerMile: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const toLoadAtFacilityResponse = (load: Load): LoadAtFacilityResponse => ({
  id: load.id,
  organizationId: load.organizationId,
  loadNumber: load.loadNumber,
  carrierId: load.carrierId,
  driverId: load.driverId,
  vehicleId: load.vehicleId,
  brokerId: load.brokerId,
  shipperId: load.shipperId,
  consigneeId: load.consigneeId,
  brokerRefNumber: load.brokerRefNumber,
  equipmentType: load.equipmentType,
  commodity: load.commodity,
  weight: load.weight,
  loadedMiles: load.loadedMiles,
  totalMiles: load.totalMiles,
  customerRate: decimalToNumber(load.customerRate),
  carrierRate: decimalToNumber(load.carrierRate),
  ratePerMile: decimalToNumber(load.ratePerMile),
  status: load.status,
  createdAt: load.createdAt,
  updatedAt: load.updatedAt,
});

export const toLoadsAtFacilityEnvelope = (
  loads: Load[],
  meta: PaginationMeta,
): { data: LoadAtFacilityResponse[]; meta: PaginationMeta } => ({
  data: loads.map((load) => toLoadAtFacilityResponse(load)),
  meta,
});
