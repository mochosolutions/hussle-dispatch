import type { PaginationMeta } from '@/shared/responseEnvelope';
import type {
  CarrierResponse,
  CarrierServiceOutput,
  CarrierWithAssetsResponse,
  CarrierWithAssetsServiceOutput,
} from '../../types/carrierTypes';

export const toCarrierResponse = (carrier: CarrierServiceOutput): CarrierResponse => {
  const response: CarrierResponse = {
    ...carrier,
  };
  return response;
};

export const toCarrierListResponse = (
  carriers: CarrierServiceOutput[],
): CarrierResponse[] => carriers.map((carrier) => toCarrierResponse(carrier));

export const toCarrierListEnvelope = (
  carriers: CarrierServiceOutput[],
  meta: PaginationMeta,
): { data: CarrierResponse[]; meta: PaginationMeta } => ({
  data: toCarrierListResponse(carriers),
  meta,
});

export const toCarrierWithAssetsResponse = (
  carrier: CarrierWithAssetsServiceOutput,
): CarrierWithAssetsResponse => ({
  ...toCarrierResponse(carrier),
  drivers: carrier.drivers,
  vehicles: carrier.vehicles,
});
