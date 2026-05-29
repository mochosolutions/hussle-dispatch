import axiosInstance from 'utils/axios';
import type { PaginationMeta } from 'features/carrier/types';

// ---------------------------------------------------------------------------
// Contract — mirrors hussle-app-dispatch-api RateconImportResponse /
// RateconImportDetailResponse + the RateconPrefill payload. Response envelope:
// single -> { data }, list -> { data, meta }.
// ---------------------------------------------------------------------------

export type RateconImportStatus =
  | 'RECEIVED'
  | 'EXTRACTING'
  | 'PENDING_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXTRACTION_FAILED';

export type RateconImportSource = 'EMAIL_INBOUND' | 'MANUAL_UPLOAD';

export interface RateconImport {
  id: string;
  status: RateconImportStatus;
  source: RateconImportSource;
  documentId: string | null;
  brokerName: string | null;
  brokerEmail: string | null;
  laneSummary: string | null;
  customerRate: string | null;
  pickupDate: string | null;
  matchedCustomerId: string | null;
  extractionConfidence: string | null;
  requiresReview: boolean;
  warnings: string[];
  isRatecon: boolean | null;
  documentTypeGuess: string | null;
  failureReason: string | null;
  emailFrom: string | null;
  emailSubject: string | null;
  acceptedLoadId: string | null;
  receivedAt: string;
  createdAt: string;
}

export interface RateconPrefillStop {
  type: string | null;
  sequence: number;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  appointmentEndTime: string | null;
  schedulingType: string | null;
  appointmentNumber: string | null;
  contactName: string | null;
  contactPhone: string | null;
  commodity: string | null;
  weight: number | null;
  pieceCount: number | null;
  isHazmat: boolean | null;
  isTarp: boolean | null;
  isTempControlled: boolean | null;
  notes: string | null;
}

export interface RateconCustomerHint {
  companyName: string | null;
  mcNumber: string | null;
  dotNumber: string | null;
  matchedCustomerId: string | null;
}

export interface RateconPrefill {
  externalRefNumber: string | null;
  customerRate: number | null;
  equipmentType: string | null;
  commodity: string | null;
  weight: number | null;
  pieceCount: number | null;
  isHazmat: boolean | null;
  isTarp: boolean | null;
  isTeamDriver: boolean | null;
  reeferTempMin: number | null;
  reeferTempMax: number | null;
  reeferMode: 'continuous' | 'cycle-sentry' | null;
  reeferPrecool: number | null;
  dispatcherNotes: string | null;
  driverInstructions: string | null;
  stops: RateconPrefillStop[];
  customerHint: RateconCustomerHint;
}

export interface RateconImportDetail extends RateconImport {
  prefill: RateconPrefill | null;
}

export interface ListImportsParams {
  status?: RateconImportStatus;
  includeResolved?: boolean;
}

interface SingleEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: PaginationMeta;
}

export const listRateconImports = async (
  params: ListImportsParams = {},
): Promise<{ data: RateconImport[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<ListEnvelope<RateconImport>>('/ratecons/imports', {
    params,
  });
  return response.data;
};

export const getRateconImport = async (id: string): Promise<RateconImportDetail> => {
  const response = await axiosInstance.get<SingleEnvelope<RateconImportDetail>>(
    `/ratecons/imports/${id}`,
  );
  return response.data.data;
};

export const acceptRateconImport = async (
  id: string,
  loadId: string,
): Promise<RateconImport> => {
  const response = await axiosInstance.post<SingleEnvelope<RateconImport>>(
    `/ratecons/imports/${id}/accept`,
    { loadId },
  );
  return response.data.data;
};

export const rejectRateconImport = async (id: string): Promise<{ rejected: boolean }> => {
  const response = await axiosInstance.post<SingleEnvelope<{ rejected: boolean }>>(
    `/ratecons/imports/${id}/reject`,
  );
  return response.data.data;
};

export const retryRateconImport = async (id: string): Promise<RateconImport> => {
  const response = await axiosInstance.post<SingleEnvelope<RateconImport>>(
    `/ratecons/imports/${id}/retry`,
  );
  return response.data.data;
};

export const manualUploadRateconImport = async (file: File): Promise<RateconImport> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post<SingleEnvelope<RateconImport>>(
    '/ratecons/imports/manual',
    formData,
  );
  return response.data.data;
};
