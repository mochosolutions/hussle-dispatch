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

export const getVehicle = async (id: string): Promise<Vehicle> => {
  const response = await axiosInstance.get<GetVehicleResponse>(`/vehicles/${id}`);
  return response.data.data;
};

export const createVehicle = async (data: CreateVehicleInput): Promise<Vehicle> => {
  const response = await axiosInstance.post<GetVehicleResponse>('/vehicles', data);
  return response.data.data;
};

export const updateVehicle = async (
  id: string,
  data: UpdateVehicleInput,
): Promise<Vehicle> => {
  const response = await axiosInstance.patch<GetVehicleResponse>(`/vehicles/${id}`, data);
  return response.data.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/vehicles/${id}`);
};

export const assignDriver = async (
  vehicleId: string,
  driverId: string,
): Promise<Vehicle> => {
  const response = await axiosInstance.patch<GetVehicleResponse>(
    `/vehicles/${vehicleId}/assign-driver`,
    { driverId },
  );
  return response.data.data;
};

export const unassignDriver = async (vehicleId: string): Promise<Vehicle> => {
  const response = await axiosInstance.patch<GetVehicleResponse>(
    `/vehicles/${vehicleId}/unassign-driver`,
  );
  return response.data.data;
};

export interface VehicleLoad {
  id: string;
  referenceNumber: string;
  origin: string;
  destination: string;
  status: string;
  rate: string;
  miles: number;
  pickupDate: string;
  deliveryDate: string | null;
}

interface GetVehicleLoadsResponse {
  data: VehicleLoad[];
  meta: PaginationMeta;
}

export const getVehicleLoads = async (
  vehicleId: string,
  params?: { page?: number; limit?: number },
): Promise<{ data: VehicleLoad[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetVehicleLoadsResponse>(
    `/vehicles/${vehicleId}/loads`,
    { params },
  );
  return response.data;
};

export interface VehicleWeeklyRevenuePoint {
  weekStart: string;
  weekEnd: string;
  revenue: number;
  loadCount: number;
  target: number;
}

interface GetVehicleWeeklyRevenueResponse {
  data: VehicleWeeklyRevenuePoint[];
}

export const getVehicleWeeklyRevenue = async (
  vehicleId: string,
  weeks = 8,
): Promise<VehicleWeeklyRevenuePoint[]> => {
  const response = await axiosInstance.get<GetVehicleWeeklyRevenueResponse>(
    `/loads/vehicles/${vehicleId}/weekly-revenue`,
    { params: { weeks } },
  );
  return response.data.data;
};
