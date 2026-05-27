import axiosInstance from 'utils/axios';
import type { OrgSettings, SettingsFormValues } from 'features/settings/types';

export type Settings = OrgSettings;

export type UpdateSettingsPayload = Partial<SettingsFormValues>;

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
