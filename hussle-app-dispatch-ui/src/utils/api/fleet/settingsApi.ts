import axiosInstance from 'utils/axios';

export interface Settings {
  id: string;
  organizationId: string;
  timezone: string;
  currency: string;
  distanceUnit: string;
  dateFormat: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  defaultPaymentTerms: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  timezone?: string;
  currency?: string;
  distanceUnit?: string;
  dateFormat?: string;
  invoicePrefix?: string;
  invoiceNextNumber?: number;
  defaultPaymentTerms?: number;
}

interface GetSettingsResponse {
  data: Settings;
}

export const fetchSettings = async (): Promise<{ settings: Settings }> => {
  const response = await axiosInstance.get<GetSettingsResponse>('/settings');
  return { settings: response.data.data };
};

export const updateSettings = async (
  data: UpdateSettingsPayload,
): Promise<{ settings: Settings }> => {
  const response = await axiosInstance.put<GetSettingsResponse>('/settings', data);
  return { settings: response.data.data };
};
