import axiosInstance from 'utils/axios';
import type { Stop } from 'features/load/types';

export interface CreateStopInput {
  type: string;
  sequence?: number;
  facilityName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
}

export const createStop = async (
  loadId: string,
  data: CreateStopInput,
): Promise<{ stop: Stop }> => {
  const response = await axiosInstance.post<Stop>(`/loads/${loadId}/stops`, data);
  return { stop: response.data };
};

export const updateStop = async (
  loadId: string,
  stopId: string,
  data: Partial<CreateStopInput>,
): Promise<{ stop: Stop }> => {
  const response = await axiosInstance.patch<Stop>(`/loads/${loadId}/stops/${stopId}`, data);
  return { stop: response.data };
};

export const deleteStop = async (loadId: string, stopId: string): Promise<void> => {
  await axiosInstance.delete(`/loads/${loadId}/stops/${stopId}`);
};

export const reorderStops = async (
  loadId: string,
  stopOrder: { id: string; sequence: number }[],
): Promise<void> => {
  await axiosInstance.patch(`/loads/${loadId}/stops/reorder`, { stopOrder });
};
