import axios from 'axios';
import config from '../../../config';

const createDriverPortalAxios = (token: string) => {
  const instance = axios.create({
    baseURL: `${config.apiUrl}/api/v1/driver-portal/portal`,
  });

  instance.interceptors.request.use((reqConfig) => {
    reqConfig.params = { ...reqConfig.params, token };
    return reqConfig;
  });

  return instance;
};

// --- Types ---

export interface DriverPortalStop {
  id: string;
  type: string;
  sequence: number;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
}

export interface DriverPortalLoad {
  id: string;
  loadNumber: string;
  status: string;
  equipmentType: string | null;
  commodity: string | null;
  weight: number | null;
  driverInstructions: string | null;
  stops: DriverPortalStop[];
  driver: { firstName: string; lastName: string } | null;
}

export interface PresignResult {
  documentId: string;
  presignedUrl: string;
  expiresIn: number;
}

export interface CheckInInput {
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  eta?: string;
  notes?: string;
}

// --- API functions ---

export const getLoadSummary = async (token: string): Promise<DriverPortalLoad> => {
  const api = createDriverPortalAxios(token);
  const response = await api.get<{ data: DriverPortalLoad }>('/load');
  return response.data.data;
};

export const advanceStatus = async (
  token: string,
  status: string,
): Promise<{ success: boolean; status: string }> => {
  const api = createDriverPortalAxios(token);
  const response = await api.post<{ data: { success: boolean; status: string } }>('/load/status', {
    status,
  });
  return response.data.data;
};

export const checkIn = async (token: string, input: CheckInInput): Promise<void> => {
  const api = createDriverPortalAxios(token);
  await api.post('/load/check-in', input);
};

export const presignDocument = async (
  token: string,
  input: { fileName: string; mimeType: string; type: string },
): Promise<PresignResult> => {
  const api = createDriverPortalAxios(token);
  const response = await api.post<{ data: PresignResult }>('/load/documents/presign', input);
  return response.data.data;
};

export const confirmDocument = async (token: string, documentId: string): Promise<void> => {
  const api = createDriverPortalAxios(token);
  await api.post(`/load/documents/${documentId}/confirm`);
};
