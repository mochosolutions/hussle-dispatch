import type { PaginationMeta } from '@/shared/responseEnvelope';
import type { VehicleResponse, VehicleWithExpenses } from '../../types/vehicleTypes';

export const toVehicleResponse = (vehicle: VehicleWithExpenses): VehicleResponse => ({
  ...vehicle,
});

export const toVehicleListResponse = (vehicles: VehicleWithExpenses[]): VehicleResponse[] =>
  vehicles.map((vehicle) => toVehicleResponse(vehicle));

export const toVehicleListEnvelope = (
  vehicles: VehicleWithExpenses[],
  meta: PaginationMeta,
): { data: VehicleResponse[]; meta: PaginationMeta } => ({
  data: toVehicleListResponse(vehicles),
  meta,
});
