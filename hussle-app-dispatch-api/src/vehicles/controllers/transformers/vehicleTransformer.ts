import type { PaginationMeta } from '@/shared/responseEnvelope';
import type {
  VehicleListItem,
  VehicleResponse,
  VehicleWithExpenses,
} from '../../types/vehicleTypes';

export interface VehicleListItemResponse extends VehicleResponse {
  activeLoadCount: number;
}

export const toVehicleResponse = (vehicle: VehicleWithExpenses): VehicleResponse => ({
  ...vehicle,
});

export const toVehicleListItemResponse = (vehicle: VehicleListItem): VehicleListItemResponse => ({
  ...vehicle,
});

export const toVehicleListEnvelope = (
  vehicles: VehicleListItem[],
  meta: PaginationMeta,
): { data: VehicleListItemResponse[]; meta: PaginationMeta } => ({
  data: vehicles.map((vehicle) => toVehicleListItemResponse(vehicle)),
  meta,
});
