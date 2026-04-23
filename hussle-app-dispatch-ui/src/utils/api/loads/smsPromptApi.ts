import axiosInstance from 'utils/axios';
import type { PaginationMeta } from 'features/carrier/types';

export interface SmsPromptScheduleResponse {
  id: string;
  loadId: string;
  driverId: string;
  organizationId: string;
  anchor: 'DISPATCHED' | 'PRE_PICKUP' | 'POST_PICKUP' | 'TRANSIT_INTERVAL' | 'MANUAL';
  scheduledAt: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELED';
  sentAt: string | null;
  twilioMessageSid: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SendSmsPromptResponse {
  data: SmsPromptScheduleResponse;
}

interface ListSmsPromptsResponse {
  data: SmsPromptScheduleResponse[];
  meta: PaginationMeta;
}

export const sendSmsPrompt = async (loadId: string): Promise<SmsPromptScheduleResponse> => {
  const response = await axiosInstance.post<SendSmsPromptResponse>(
    `/loads/${loadId}/sms-prompts`,
  );
  return response.data.data;
};

export const listSmsPrompts = async (
  loadId: string,
  params: { page?: number; limit?: number } = {},
): Promise<{ data: SmsPromptScheduleResponse[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<ListSmsPromptsResponse>(
    `/loads/${loadId}/sms-prompts`,
    { params },
  );
  return response.data;
};
