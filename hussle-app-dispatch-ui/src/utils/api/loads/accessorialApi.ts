import axiosInstance from 'utils/axios';
import type { AccessorialCharge } from 'features/load/types';

export interface CreateAccessorialInput {
  type: string;
  description?: string;
  amount: number;
  billTo?: string;
}

export const createAccessorial = async (
  loadId: string,
  data: CreateAccessorialInput,
): Promise<{ accessorial: AccessorialCharge }> => {
  const response = await axiosInstance.post<AccessorialCharge>(
    `/loads/${loadId}/accessorials`,
    data,
  );
  return { accessorial: response.data };
};

export const updateAccessorial = async (
  id: string,
  data: Partial<CreateAccessorialInput>,
): Promise<{ accessorial: AccessorialCharge }> => {
  const response = await axiosInstance.patch<AccessorialCharge>(`/loads/accessorials/${id}`, data);
  return { accessorial: response.data };
};

export const deleteAccessorial = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/loads/accessorials/${id}`);
};
