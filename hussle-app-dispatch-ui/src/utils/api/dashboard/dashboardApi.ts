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

// ---------------------------------------------------------------------------
// Pending Carriers
// ---------------------------------------------------------------------------

export interface PendingCarrier {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  onboardingStatus: string;
  entryMethod: string;
  inviteSentAt: string | null;
  completedAt: string | null;
  driverCount: number;
  vehicleCount: number;
}

interface GetPendingCarriersParams {
  page?: number;
  limit?: number;
}

interface GetPendingCarriersResponse {
  data: PendingCarrier[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const getPendingCarriers = async (
  params?: GetPendingCarriersParams,
): Promise<GetPendingCarriersResponse> => {
  const response = await axiosInstance.get<GetPendingCarriersResponse>(
    '/dashboard/pending-carriers',
    { params },
  );
  return response.data;
};
