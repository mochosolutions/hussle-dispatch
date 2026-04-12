import axiosInstance from 'utils/axios';
import type { IftaReportResponse } from 'features/accounting/types';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface GetIftaReportParams {
  year: number;
  quarter: number;
  vehicleId?: string;
}

interface GetIftaReportResponse {
  data: IftaReportResponse;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const getIftaReport = async (params: GetIftaReportParams): Promise<IftaReportResponse> => {
  const response = await axiosInstance.get<GetIftaReportResponse>('/ifta/report', { params });
  return response.data.data;
};
