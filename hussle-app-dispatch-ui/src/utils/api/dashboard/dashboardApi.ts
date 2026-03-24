import axiosInstance from 'utils/axios';
import type { DashboardKpis, WeeklyGrossItem, AttentionItem } from 'features/dashboard/types';

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface GetKpisResponse {
  data: DashboardKpis;
}

interface GetWeeklyGrossResponse {
  data: WeeklyGrossItem[];
}

interface GetAttentionItemsResponse {
  data: AttentionItem[];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const getKpis = async (): Promise<DashboardKpis> => {
  const response = await axiosInstance.get<GetKpisResponse>('/dashboard/kpis');
  return response.data.data;
};

export const getWeeklyGross = async (): Promise<WeeklyGrossItem[]> => {
  const response = await axiosInstance.get<GetWeeklyGrossResponse>('/loads/weekly-gross');
  return response.data.data;
};

export const getAttentionItems = async (): Promise<AttentionItem[]> => {
  const response = await axiosInstance.get<GetAttentionItemsResponse>(
    '/dashboard/attention-items',
  );
  return response.data.data;
};
