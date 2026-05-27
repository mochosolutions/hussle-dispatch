import axiosInstance from 'utils/axios';
import type {
  Customer,
  CustomerListParams,
  CustomerListResponse,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  PaginationMeta,
} from 'features/customer/types';

interface GetCustomersResponse {
  data: Customer[];
  meta: PaginationMeta;
}

interface GetCustomerResponse {
  data: Customer;
}

export const getCustomers = async (
  params: CustomerListParams,
): Promise<CustomerListResponse> => {
  const response = await axiosInstance.get<GetCustomersResponse>('/customers', { params });
  return response.data;
};

export const getCustomer = async (id: string): Promise<{ customer: Customer }> => {
  const response = await axiosInstance.get<GetCustomerResponse>(`/customers/${id}`);
  return { customer: response.data.data };
};

export const createCustomer = async (
  data: CreateCustomerPayload,
): Promise<{ customer: Customer }> => {
  const response = await axiosInstance.post<GetCustomerResponse>('/customers', data);
  return { customer: response.data.data };
};

export const updateCustomer = async (
  id: string,
  data: UpdateCustomerPayload,
): Promise<{ customer: Customer }> => {
  const response = await axiosInstance.patch<GetCustomerResponse>(`/customers/${id}`, data);
  return { customer: response.data.data };
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/customers/${id}`);
};

export interface CustomerStats {
  totalRevenue: string;
  avgDaysToPay: number | null;
  outstandingAR: string;
  loadCount: number;
}

export const getCustomerStats = async (id: string): Promise<CustomerStats> => {
  const response = await axiosInstance.get<{ data: CustomerStats }>(`/customers/${id}/stats`);
  return response.data.data;
};
