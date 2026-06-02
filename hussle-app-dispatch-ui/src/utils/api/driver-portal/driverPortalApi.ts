import axios from 'axios';
import axiosPrivate from 'utils/axios';
import config from '../../../config';

// Driver-portal reads/writes now run on the shared session cookie (set by
// setup/login) and pass an explicit loadId — the bare per-load `?token=` link
// no longer authorizes. `axiosPrivate` already carries `withCredentials`.
const createDriverPortalAxios = (loadId: string) => {
  const instance = axios.create({
    baseURL: `${config.apiUrl}/api/v1/driver-portal/portal`,
    withCredentials: true,
  });

  instance.interceptors.request.use((reqConfig) => {
    reqConfig.params = { ...reqConfig.params, loadId };
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
  appointmentStart: string | null;
  appointmentEnd: string | null;
  schedulingType: string;
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
  pieceCount: number | null;
  isHazmat: boolean;
  isTempControlled: boolean;
  driverInstructions: string | null;
  stops: DriverPortalStop[];
  documents: DriverPortalDocument[];
  driver: { firstName: string; lastName: string } | null;
}

export interface DriverPortalDocument {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: string;
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

// --- Auth (setup + login) types ---

export interface AcceptDriverInviteInput {
  password: string;
  email?: string;
}

export interface AcceptDriverInviteResult {
  driverId: string;
  userId: string;
  organizationId: string;
  role: string;
  accessTokenExpiresAt: string;
}

// --- API functions ---

// "My Loads" list — every load assigned to the session's own driver. Runs on
// the shared session cookie (no loadId), so it uses axiosPrivate directly.
export const getDriverLoads = async (): Promise<DriverPortalLoad[]> => {
  const response = await axiosPrivate.get<{ data: DriverPortalLoad[] }>(
    '/driver-portal/portal/loads',
  );
  return response.data.data;
};

export const getLoadSummary = async (loadId: string): Promise<DriverPortalLoad> => {
  const api = createDriverPortalAxios(loadId);
  const response = await api.get<{ data: DriverPortalLoad }>('/load');
  return response.data.data;
};

export const advanceStatus = async (
  loadId: string,
  status: string,
): Promise<{ success: boolean; status: string }> => {
  const api = createDriverPortalAxios(loadId);
  const response = await api.post<{ data: { success: boolean; status: string } }>('/load/status', {
    status,
  });
  return response.data.data;
};

export const checkIn = async (
  loadId: string,
  input: CheckInInput,
  signal?: AbortSignal,
): Promise<void> => {
  const api = createDriverPortalAxios(loadId);
  await api.post('/load/check-in', input, { signal });
};

export const presignDocument = async (
  loadId: string,
  input: { fileName: string; mimeType: string; type: string },
): Promise<PresignResult> => {
  const api = createDriverPortalAxios(loadId);
  const response = await api.post<{ data: PresignResult }>('/load/documents/presign', input);
  return response.data.data;
};

export const confirmDocument = async (loadId: string, documentId: string): Promise<void> => {
  const api = createDriverPortalAxios(loadId);
  await api.post(`/load/documents/${documentId}/confirm`);
};

// Completes driver account setup from the emailed/SMS'd invite link. Sets the
// HttpOnly session cookies server-side; the client never reads the tokens.
export const acceptDriverInvite = async (
  token: string,
  input: AcceptDriverInviteInput,
): Promise<AcceptDriverInviteResult> => {
  const response = await axiosPrivate.post<AcceptDriverInviteResult>(
    `/driver-portal/setup/${token}`,
    input,
  );
  return response.data;
};

// Opens a confirmed document in a new tab via the documents download endpoint,
// which 302-redirects to a short-lived signed GET URL. The driver session
// cookie authorizes the read.
export const getDocumentDownloadUrl = (documentId: string): string =>
  `${config.apiUrl}/api/v1/documents/${documentId}/download`;
