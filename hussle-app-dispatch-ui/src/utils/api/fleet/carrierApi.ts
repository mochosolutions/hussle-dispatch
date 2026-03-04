import axiosInstance from 'utils/axios';
import type {
  Carrier,
  CarrierListItem,
  CarrierOnboardingStatus,
  CreateCarrierInput,
  UpdateCarrierInput,
  PaginationMeta,
} from 'pages/fleet/types';

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

export const getCarrier = async (id: string): Promise<{ carrier: Carrier }> => {
  const response = await axiosInstance.get<GetCarrierResponse>(`/carriers/${id}`);
  return { carrier: response.data.data };
};

export const createCarrier = async (data: CreateCarrierInput): Promise<{ carrier: Carrier }> => {
  const response = await axiosInstance.post<GetCarrierResponse>('/carriers', data);
  return { carrier: response.data.data };
};

export const updateCarrier = async (
  id: string,
  data: UpdateCarrierInput,
): Promise<{ carrier: Carrier }> => {
  const response = await axiosInstance.put<GetCarrierResponse>(`/carriers/${id}`, data);
  return { carrier: response.data.data };
};

export const deleteCarrier = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/carriers/${id}`);
};

export const getCarrierOnboarding = async (
  id: string,
): Promise<{ onboarding: CarrierOnboardingStatus }> => {
  const response = await axiosInstance.get<CarrierOnboardingResponse>(
    `/carriers/${id}/onboarding`,
  );
  return { onboarding: response.data.data };
};
