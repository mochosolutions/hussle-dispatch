import axiosInstance from 'utils/axios';
import type {
  SettlementListItem,
  SettlementDetail,
  GenerateSettlementInput,
  PaySettlementInput,
  DisputeSettlementInput,
  CreateAdjustmentInput,
  PaginationMeta,
} from 'features/accounting/types';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface GetSettlementsParams {
  page?: number;
  limit?: number;
  status?: string;
  carrierId?: string;
  periodStart?: string;
  periodEnd?: string;
}

interface GetSettlementsResponse {
  data: SettlementListItem[];
  meta: PaginationMeta;
}

interface GetSettlementResponse {
  data: SettlementDetail;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const getSettlements = async (
  params: GetSettlementsParams,
): Promise<{ data: SettlementListItem[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetSettlementsResponse>('/settlements', { params });
  return response.data;
};

export const getSettlement = async (id: string): Promise<SettlementDetail> => {
  const response = await axiosInstance.get<GetSettlementResponse>(`/settlements/${id}`);
  return response.data.data;
};

export const generateSettlement = async (
  input: GenerateSettlementInput,
): Promise<SettlementDetail> => {
  const response = await axiosInstance.post<GetSettlementResponse>('/settlements/generate', input);
  return response.data.data;
};

export const approveSettlement = async (id: string): Promise<SettlementDetail> => {
  const response = await axiosInstance.patch<GetSettlementResponse>(`/settlements/${id}/approve`);
  return response.data.data;
};

export const paySettlement = async (
  id: string,
  input: PaySettlementInput,
): Promise<SettlementDetail> => {
  const response = await axiosInstance.patch<GetSettlementResponse>(
    `/settlements/${id}/pay`,
    input,
  );
  return response.data.data;
};

export const disputeSettlement = async (
  id: string,
  input: DisputeSettlementInput,
): Promise<SettlementDetail> => {
  const response = await axiosInstance.patch<GetSettlementResponse>(
    `/settlements/${id}/dispute`,
    input,
  );
  return response.data.data;
};

export const addAdjustment = async (
  settlementId: string,
  input: CreateAdjustmentInput,
): Promise<SettlementDetail> => {
  const response = await axiosInstance.post<GetSettlementResponse>(
    `/settlements/${settlementId}/adjustments`,
    input,
  );
  return response.data.data;
};
