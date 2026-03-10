import axiosInstance from 'utils/axios';
import type {
  LoadListItem,
  LoadDetail,
  CreateLoadInput,
  UpdateLoadInput,
  LoadFilters,
  CheckCall,
  StatusHistoryEntry,
  StatusTransitionResponse,
  TransitionStatusInput,
  CreateCheckCallInput,
} from 'features/load/types';
import type { PaginationMeta } from 'features/carrier/types';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface GetLoadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  carrierId?: string;
  equipmentType?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface GetLoadsResponse {
  data: LoadListItem[];
  meta: PaginationMeta;
}

interface GetLoadResponse {
  data: LoadDetail;
}

interface StatusTransitionApiResponse {
  success: boolean;
  load?: LoadDetail;
  warnings?: { code: string; message: string; detail?: string }[];
  error?: { code: string; message: string };
}

interface GetCheckCallsResponse {
  data: CheckCall[];
}

interface CreateCheckCallResponse {
  data: CheckCall;
}

interface GetStatusHistoryResponse {
  data: StatusHistoryEntry[];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const getLoads = async (
  params: GetLoadsParams,
): Promise<{ data: LoadListItem[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetLoadsResponse>('/loads', { params });
  return response.data;
};

export const getLoad = async (id: string): Promise<{ load: LoadDetail }> => {
  const response = await axiosInstance.get<GetLoadResponse>(`/loads/${id}`);
  return { load: response.data.data };
};

export const createLoad = async (
  data: CreateLoadInput,
): Promise<{ load: LoadDetail }> => {
  const response = await axiosInstance.post<GetLoadResponse>('/loads', data);
  return { load: response.data.data };
};

export const updateLoad = async (
  id: string,
  data: UpdateLoadInput,
): Promise<{ load: LoadDetail }> => {
  const response = await axiosInstance.patch<GetLoadResponse>(`/loads/${id}`, data);
  return { load: response.data.data };
};

export const deleteLoad = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/loads/${id}`);
};

export const transitionStatus = async (
  id: string,
  input: TransitionStatusInput,
): Promise<StatusTransitionResponse> => {
  const response = await axiosInstance.patch<StatusTransitionApiResponse>(
    `/loads/${id}/status`,
    input,
  );
  return response.data;
};

export const getCheckCalls = async (
  loadId: string,
): Promise<{ checkCalls: CheckCall[] }> => {
  const response = await axiosInstance.get<GetCheckCallsResponse>(
    `/loads/${loadId}/check-calls`,
  );
  return { checkCalls: response.data.data };
};

export const createCheckCall = async (
  loadId: string,
  data: CreateCheckCallInput,
): Promise<{ checkCall: CheckCall }> => {
  const response = await axiosInstance.post<CreateCheckCallResponse>(
    `/loads/${loadId}/check-calls`,
    data,
  );
  return { checkCall: response.data.data };
};

export const getStatusHistory = async (
  loadId: string,
): Promise<{ statusHistory: StatusHistoryEntry[] }> => {
  const response = await axiosInstance.get<GetStatusHistoryResponse>(
    `/loads/${loadId}/status-history`,
  );
  return { statusHistory: response.data.data };
};

export const getLoadFiltersFromParams = (filters: LoadFilters): GetLoadsParams => {
  const params: GetLoadsParams = {};

  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.status && filters.status.length > 0) {
    params.status = filters.status;
  }
  if (filters.carrierId) {
    params.carrierId = filters.carrierId;
  }
  if (filters.equipmentType) {
    params.equipmentType = filters.equipmentType;
  }
  if (filters.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    params.dateTo = filters.dateTo;
  }

  return params;
};
