import axiosInstance from 'utils/axios';
import type {
  LoadListItem,
  LoadDetail,
  CreateLoadInput,
  UpdateLoadInput,
  AssignLoadInput,
  AssignLoadResponse,
  LoadCreateResponse,
  LoadUpdateResponse,
  LoadFilters,
  CheckCall,
  StatusHistoryEntry,
  TransitionStatusInput,
  CreateCheckCallInput,
  Warning,
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

interface MutateLoadResponse {
  data: LoadDetail;
  warnings?: Warning[];
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

export const getLoad = async (id: string): Promise<LoadDetail> => {
  const response = await axiosInstance.get<GetLoadResponse>(`/loads/${id}`);
  return response.data.data;
};

export const createLoad = async (
  data: CreateLoadInput,
): Promise<LoadCreateResponse> => {
  const response = await axiosInstance.post<MutateLoadResponse>('/loads', data);
  return {
    data: response.data.data,
    warnings: response.data.warnings ?? [],
  };
};

export const updateLoad = async (
  id: string,
  data: UpdateLoadInput,
): Promise<LoadUpdateResponse> => {
  const response = await axiosInstance.patch<MutateLoadResponse>(`/loads/${id}`, data);
  return {
    data: response.data.data,
    warnings: response.data.warnings ?? [],
  };
};

export const assignLoad = async (
  id: string,
  data: AssignLoadInput,
): Promise<AssignLoadResponse> => {
  const response = await axiosInstance.patch<{ data: AssignLoadResponse }>(
    `/loads/${id}/assignment`,
    data,
  );
  return response.data.data;
};

export const deleteLoad = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/loads/${id}`);
};

export const transitionStatus = async (
  id: string,
  input: TransitionStatusInput,
): Promise<StatusTransitionApiResponse> => {
  const response = await axiosInstance.patch<{ data: StatusTransitionApiResponse }>(
    `/loads/${id}/status`,
    input,
  );
  return response.data.data;
};

export const getCheckCalls = async (
  loadId: string,
): Promise<CheckCall[]> => {
  const response = await axiosInstance.get<GetCheckCallsResponse>(
    `/loads/${loadId}/check-calls`,
  );
  return response.data.data;
};

export const createCheckCall = async (
  loadId: string,
  data: CreateCheckCallInput,
): Promise<CheckCall> => {
  const response = await axiosInstance.post<CreateCheckCallResponse>(
    `/loads/${loadId}/check-calls`,
    data,
  );
  return response.data.data;
};

export const getStatusHistory = async (
  loadId: string,
): Promise<StatusHistoryEntry[]> => {
  const response = await axiosInstance.get<GetStatusHistoryResponse>(
    `/loads/${loadId}/status-history`,
  );
  return response.data.data;
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
