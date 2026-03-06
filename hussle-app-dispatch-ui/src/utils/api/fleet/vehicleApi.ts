import axiosInstance from 'utils/axios';
import type {
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
  PaginationMeta,
} from 'features/carrier/types';

interface GetVehiclesParams {
  page?: number;
  limit?: number;
  search?: string;
  carrierId?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface GetVehiclesResponse {
  data: Vehicle[];
  meta: PaginationMeta;
}

interface GetVehicleResponse {
  data: Vehicle;
}

export const getVehicles = async (
  params: GetVehiclesParams,
): Promise<{ data: Vehicle[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetVehiclesResponse>('/vehicles', { params });
  return response.data;
};

export const getVehicle = async (id: string): Promise<{ vehicle: Vehicle }> => {
  const response = await axiosInstance.get<GetVehicleResponse>(`/vehicles/${id}`);
  return { vehicle: response.data.data };
};

export const createVehicle = async (data: CreateVehicleInput): Promise<{ vehicle: Vehicle }> => {
  const response = await axiosInstance.post<GetVehicleResponse>('/vehicles', data);
  return { vehicle: response.data.data };
};

export const updateVehicle = async (
  id: string,
  data: UpdateVehicleInput,
): Promise<{ vehicle: Vehicle }> => {
  const response = await axiosInstance.patch<GetVehicleResponse>(`/vehicles/${id}`, data);
  return { vehicle: response.data.data };
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/vehicles/${id}`);
};
