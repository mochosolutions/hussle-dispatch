import type { Load, Stop } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import { computeCommoditySummary } from '@/shared/utils/computeCommoditySummary';

type LoadWithStops = Load & { stops: Stop[] };

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
  contactId: string | null;
  externalRefNumber: string | null;
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

export const toLoadAtFacilityResponse = (load: LoadWithStops): LoadAtFacilityResponse => {
  const cargo = computeCommoditySummary(load.stops);

  return {
    id: load.id,
    organizationId: load.organizationId,
    loadNumber: load.loadNumber,
    carrierId: load.carrierId,
    driverId: load.driverId,
    vehicleId: load.vehicleId,
    contactId: load.contactId,
    externalRefNumber: load.externalRefNumber,
    equipmentType: load.equipmentType,
    commodity: cargo.commodity ?? null,
    weight: cargo.weight ?? null,
    loadedMiles: load.loadedMiles,
    totalMiles: load.totalMiles,
    customerRate: decimalToNumber(load.customerRate),
    carrierRate: decimalToNumber(load.carrierRate),
    ratePerMile: decimalToNumber(load.ratePerMile),
    status: load.status,
    createdAt: load.createdAt,
    updatedAt: load.updatedAt,
  };
};

export const toLoadsAtFacilityEnvelope = (
  loads: LoadWithStops[],
  meta: PaginationMeta,
): { data: LoadAtFacilityResponse[]; meta: PaginationMeta } => ({
  data: loads.map((load) => toLoadAtFacilityResponse(load)),
  meta,
});
