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

export const getKpis = async (): Promise<{ kpis: DashboardKpis }> => {
  const response = await axiosInstance.get<GetKpisResponse>('/dashboard/kpis');
  return { kpis: response.data.data };
};

export const getWeeklyGross = async (): Promise<{ weeklyGross: WeeklyGrossItem[] }> => {
  const response = await axiosInstance.get<GetWeeklyGrossResponse>('/loads/weekly-gross');
  return { weeklyGross: response.data.data };
};

export const getAttentionItems = async (): Promise<{ attentionItems: AttentionItem[] }> => {
  const response = await axiosInstance.get<GetAttentionItemsResponse>(
    '/dashboard/attention-items',
  );
  return { attentionItems: response.data.data };
};
