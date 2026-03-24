import axiosInstance from 'utils/axios';
import type {
  Carrier,
  CarrierListItem,
  CarrierOnboardingStatus,
  CarrierNote,
  CreateCarrierInput,
  CreateCarrierNoteInput,
  UpdateCarrierInput,
  Driver,
  Vehicle,
  CreateDriverInput,
  CreateVehicleInput,
  PaginationMeta,
} from 'features/carrier/types';

interface GetCarriersParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface GetCarriersResponse {
  data: CarrierListItem[];
  meta: PaginationMeta;
}

interface GetCarrierResponse {
  data: Carrier;
}

interface CarrierOnboardingResponse {
  data: CarrierOnboardingStatus;
}

export const getCarriers = async (
  params: GetCarriersParams,
): Promise<{ data: CarrierListItem[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetCarriersResponse>('/carriers', { params });
  return response.data;
};

export const getCarrier = async (id: string): Promise<Carrier> => {
  const response = await axiosInstance.get<GetCarrierResponse>(`/carriers/${id}`);
  return response.data.data;
};

export const createCarrier = async (data: CreateCarrierInput): Promise<Carrier> => {
  const response = await axiosInstance.post<GetCarrierResponse>('/carriers', data);
  return response.data.data;
};

export const updateCarrier = async (
  id: string,
  data: UpdateCarrierInput,
): Promise<Carrier> => {
  const response = await axiosInstance.patch<GetCarrierResponse>(`/carriers/${id}`, data);
  return response.data.data;
};

export const deleteCarrier = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/carriers/${id}`);
};

export const getCarrierOnboarding = async (
  id: string,
): Promise<CarrierOnboardingStatus> => {
  const response = await axiosInstance.get<CarrierOnboardingResponse>(
    `/carriers/${id}/onboarding`,
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier Notes
// ---------------------------------------------------------------------------

interface GetCarrierNotesResponse {
  data: CarrierNote[];
}

interface CreateCarrierNoteResponse {
  data: CarrierNote;
}

export const getCarrierNotes = async (
  carrierId: string,
): Promise<CarrierNote[]> => {
  const response = await axiosInstance.get<GetCarrierNotesResponse>(
    `/carriers/${carrierId}/notes`,
  );
  return response.data.data;
};

export const createCarrierNote = async (
  carrierId: string,
  data: CreateCarrierNoteInput,
): Promise<CarrierNote> => {
  const response = await axiosInstance.post<CreateCarrierNoteResponse>(
    `/carriers/${carrierId}/notes`,
    data,
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier Drivers & Vehicles (scoped to carrier)
// ---------------------------------------------------------------------------

interface GetCarrierDriversResponse {
  data: Driver[];
  meta: PaginationMeta;
}

interface GetCarrierVehiclesResponse {
  data: Vehicle[];
  meta: PaginationMeta;
}

export const getCarrierDrivers = async (
  carrierId: string,
): Promise<Driver[]> => {
  const response = await axiosInstance.get<GetCarrierDriversResponse>(
    `/drivers`,
    { params: { carrierId } },
  );
  return response.data.data;
};

export const getCarrierVehicles = async (
  carrierId: string,
): Promise<Vehicle[]> => {
  const response = await axiosInstance.get<GetCarrierVehiclesResponse>(
    `/vehicles`,
    { params: { carrierId } },
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier With Assets (create flow)
// ---------------------------------------------------------------------------

export interface CreateCarrierWithAssetsInput extends CreateCarrierInput {
  drivers?: CreateDriverInput[];
  vehicles?: CreateVehicleInput[];
}

export interface CarrierWithAssets extends Carrier {
  drivers: Driver[];
  vehicles: Vehicle[];
}

interface GetCarrierWithAssetsResponse {
  data: CarrierWithAssets;
}

export const createCarrierWithAssets = async (
  data: CreateCarrierWithAssetsInput,
): Promise<CarrierWithAssets> => {
  const response = await axiosInstance.post<GetCarrierWithAssetsResponse>(
    '/carriers/with-assets',
    data,
  );
  return response.data.data;
};
