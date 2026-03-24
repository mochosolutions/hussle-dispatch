import axiosInstance from 'utils/axios';
import type {
  Driver,
  CreateDriverInput,
  UpdateDriverInput,
  PaginationMeta,
} from 'features/carrier/types';

interface GetDriversParams {
  page?: number;
  limit?: number;
  search?: string;
  carrierId?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface GetDriversResponse {
  data: Driver[];
  meta: PaginationMeta;
}

interface GetDriverResponse {
  data: Driver;
}

export const getDrivers = async (
  params: GetDriversParams,
): Promise<{ data: Driver[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetDriversResponse>('/drivers', { params });
  return response.data;
};

export const getDriver = async (id: string): Promise<Driver> => {
  const response = await axiosInstance.get<GetDriverResponse>(`/drivers/${id}`);
  return response.data.data;
};

export const createDriver = async (data: CreateDriverInput): Promise<Driver> => {
  const response = await axiosInstance.post<GetDriverResponse>('/drivers', data);
  return response.data.data;
};

export const updateDriver = async (
  id: string,
  data: UpdateDriverInput,
): Promise<Driver> => {
  const response = await axiosInstance.patch<GetDriverResponse>(`/drivers/${id}`, data);
  return response.data.data;
};

export const deleteDriver = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/drivers/${id}`);
};
