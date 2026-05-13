import type { AxiosRequestConfig } from 'axios';
import axiosInstance from 'utils/axios';
import type {
  CarrierPortalSummary,
  ConfirmUploadRequest,
  DriverEntry,
  OnboardingSession,
  PortalDocument,
  PortalSessionResponse,
  PresignRequest,
  PresignResponse,
  SaveAnswerRequest,
  SaveCompanyRequest,
  SaveDriversRequest,
  SaveEquipmentRequest,
  SignDocumentRequest,
  VehicleEntry,
} from 'features/carrier-portal/types';

// ---------------------------------------------------------------------------
// Auth helper — portal uses token-based auth, not cookie-based
// ---------------------------------------------------------------------------

const portalHeaders = (token: string): AxiosRequestConfig => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ---------------------------------------------------------------------------
// Response envelope types
// ---------------------------------------------------------------------------

interface DataEnvelope<T> {
  data: T;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export const getSession = async (token: string): Promise<PortalSessionResponse> => {
  const response = await axiosInstance.get<DataEnvelope<PortalSessionResponse>>(
    '/carrier-portal/session',
    portalHeaders(token),
  );
  return response.data.data;
};

export const saveAnswer = async (
  token: string,
  data: SaveAnswerRequest,
): Promise<OnboardingSession> => {
  const response = await axiosInstance.put<DataEnvelope<OnboardingSession>>(
    '/carrier-portal/session/answer',
    data,
    portalHeaders(token),
  );
  return response.data.data;
};

export const completeSession = async (token: string): Promise<OnboardingSession> => {
  const response = await axiosInstance.post<DataEnvelope<OnboardingSession>>(
    '/carrier-portal/session/complete',
    null,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export const saveCompany = async (
  token: string,
  data: SaveCompanyRequest,
): Promise<CarrierPortalSummary> => {
  const response = await axiosInstance.post<DataEnvelope<CarrierPortalSummary>>(
    '/carrier-portal/company',
    data,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

export const saveEquipment = async (
  token: string,
  data: SaveEquipmentRequest,
): Promise<VehicleEntry[]> => {
  const response = await axiosInstance.post<DataEnvelope<VehicleEntry[]>>(
    '/carrier-portal/equipment',
    data,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export const saveDrivers = async (
  token: string,
  data: SaveDriversRequest,
): Promise<DriverEntry[]> => {
  const response = await axiosInstance.post<DataEnvelope<DriverEntry[]>>(
    '/carrier-portal/drivers',
    data,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const listDocuments = async (token: string): Promise<PortalDocument[]> => {
  const response = await axiosInstance.get<DataEnvelope<PortalDocument[]>>(
    '/carrier-portal/documents',
    portalHeaders(token),
  );
  return response.data.data;
};

export const presignDocument = async (
  token: string,
  data: PresignRequest,
): Promise<PresignResponse> => {
  const response = await axiosInstance.post<DataEnvelope<PresignResponse>>(
    '/carrier-portal/documents/presign',
    data,
    portalHeaders(token),
  );
  return response.data.data;
};

export const confirmDocument = async (
  token: string,
  id: string,
  data: ConfirmUploadRequest,
): Promise<PortalDocument> => {
  const response = await axiosInstance.post<DataEnvelope<PortalDocument>>(
    `/carrier-portal/documents/${id}/confirm`,
    data,
    portalHeaders(token),
  );
  return response.data.data;
};

export const signDocument = async (
  token: string,
  id: string,
  data: SignDocumentRequest,
): Promise<PortalDocument> => {
  const response = await axiosInstance.post<DataEnvelope<PortalDocument>>(
    `/carrier-portal/documents/${id}/sign`,
    data,
    portalHeaders(token),
  );
  return response.data.data;
};
