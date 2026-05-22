// ---------------------------------------------------------------------------
// Carrier Portal V2 — API client (Bearer/invite-token auth)
//
// All endpoints accept the invite token as the first argument and translate it
// into an `Authorization: Bearer <token>` header. Payloads/responses follow the
// `{ data: ... }` envelope convention used across the portal API surface.
// ---------------------------------------------------------------------------

import type { AxiosRequestConfig } from 'axios';

import type { DocumentEntityType, DocumentType } from 'features/documents/types';
import type { AddressSearchResult } from 'features/place/types';
import axiosInstance from 'utils/axios';

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

const portalHeaders = (token: string): AxiosRequestConfig => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

interface DataEnvelope<T> {
  data: T;
}

// ---------------------------------------------------------------------------
// Response payload types — kept loose; sagas project into the engine Session.
// ---------------------------------------------------------------------------

export interface PortalSessionResponseV2 {
  session: {
    id: string;
    carrierId: string;
    currentStepId: string | null;
    completedStepIds: string[];
    answers: Record<string, Record<string, unknown>> | null;
    [key: string]: unknown;
  };
  carrier: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    status?: string;
    type?: string;
  } | null;
  company: {
    legalName: string | null;
    dbaName: string | null;
    taxClassification: string | null;
    tinType: string | null;
    tin: string | null;
    mcNumber: string | null;
    dotNumber: string | null;
    ein: string | null;
    phone: string | null;
    email: string | null;
    signatoryName: string | null;
    signatoryTitle: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  vehicles?: {
    id: string;
    category: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    vin: string | null;
    licensePlate: string | null;
    gvwr: number | null;
  }[];
  drivers?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    payType: string | null;
    payRate: string | number | null;
  }[];
  costAnalysis?: Record<string, unknown> | null;
  lanePreferences?: {
    homeBaseCity: string | null;
    homeBaseState: string | null;
    maxDaysOut: number | null;
    preferredLanes: unknown;
    weeklySchedule: unknown;
    freightPreferences: unknown;
    mirror: Record<string, unknown> | null;
  } | null;
  agreement: {
    id: string;
    status: string;
    embedUrl: string | null;
    signedFieldsLocked: boolean;
  } | null;
  invitation: {
    email: string | null;
    phone: string | null;
    organizationName: string | null;
  };
}

export interface AgreementSnapshotV2 {
  id: string;
  status: string;
  embedUrl: string | null;
  signedFieldsLocked: boolean;
}

export interface PresignResponseV2 {
  documentId?: string;
  id?: string;
  uploadUrl: string;
  key: string;
  fields?: Record<string, string>;
}

export interface PortalDocumentV2 {
  id: string;
  documentType: string;
  fileName?: string;
  fileUrl?: string;
  reviewStatus?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export const getSessionV2 = async (token: string): Promise<PortalSessionResponseV2> => {
  const response = await axiosInstance.get<DataEnvelope<PortalSessionResponseV2>>(
    '/carrier-portal/session',
    portalHeaders(token),
  );
  return response.data.data;
};

export interface SubmitStepBody {
  stepId: string;
  answers: Record<string, unknown>;
}

export const submitStepV2 = async (
  token: string,
  body: SubmitStepBody,
): Promise<PortalSessionResponseV2> => {
  const response = await axiosInstance.post<DataEnvelope<PortalSessionResponseV2>>(
    '/carrier-portal/session/submit-step',
    body,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Agreement
// ---------------------------------------------------------------------------

export const getAgreementV2 = async (
  token: string,
  templateKey: string,
): Promise<AgreementSnapshotV2 | null> => {
  // Backend is a paginated list endpoint: `{ data: AgreementSnapshotV2[],
  // pagination: {...} }`. Unwrap and return the most recent agreement (or null
  // when the dispatcher hasn't generated one yet).
  const response = await axiosInstance.get<DataEnvelope<AgreementSnapshotV2[]>>(
    '/carrier-portal/agreements',
    {
      ...portalHeaders(token),
      params: { templateKey },
    },
  );
  const list = response.data.data;
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  return list[0] ?? null;
};

// ---------------------------------------------------------------------------
// Cost Analysis / Lane Preferences
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Company (B2 — company-authority-question dedicated endpoint)
// ---------------------------------------------------------------------------

export interface SaveCompanyRequest {
  legalName?: string | null;
  dbaName?: string | null;
  taxClassification?: string | null;
  tin?: string | null;
  tinType?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  mcNumber?: string | null;
  dotNumber?: string | null;
  ein?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface CarrierSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  type: string;
}

export const saveCompanyV2 = async (
  token: string,
  payload: SaveCompanyRequest,
): Promise<CarrierSummary> => {
  const response = await axiosInstance.post<DataEnvelope<CarrierSummary>>(
    '/carrier-portal/company',
    payload,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Equipment (B3 — equipment-entry dedicated endpoint)
// ---------------------------------------------------------------------------

export interface VehicleInput {
  id?: string;
  category: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  gvwr?: number;
}

export interface SaveEquipmentRequest {
  vehicles: VehicleInput[];
}

export interface VehicleSummary {
  id: string;
  category: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
}

export const saveEquipmentV2 = async (
  token: string,
  payload: SaveEquipmentRequest,
): Promise<VehicleSummary[]> => {
  const response = await axiosInstance.post<DataEnvelope<VehicleSummary[]>>(
    '/carrier-portal/equipment',
    payload,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Drivers (B4 — drivers-list / drivers-solo-confirm dedicated endpoint)
// ---------------------------------------------------------------------------

export interface DriverInput {
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  payType?: string;
  payRate?: number;
}

export interface SaveDriversRequest {
  hasAdditionalDrivers: boolean;
  drivers?: DriverInput[];
}

export interface SavedDriver {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  payType: string | null;
  payRate: number | null;
}

export const saveDriversV2 = async (
  token: string,
  payload: SaveDriversRequest,
): Promise<SavedDriver[]> => {
  const response = await axiosInstance.post<DataEnvelope<SavedDriver[]>>(
    '/carrier-portal/drivers',
    payload,
    portalHeaders(token),
  );
  return response.data.data;
};

export const saveCostAnalysisV2 = async (
  token: string,
  payload: Record<string, unknown>,
): Promise<unknown> => {
  const response = await axiosInstance.post<DataEnvelope<unknown>>(
    '/carrier-portal/cost-analysis',
    payload,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Complete (B9 — terminal `complete` step)
// ---------------------------------------------------------------------------

export interface CompleteSessionResponseV2 {
  completedAt: string | null;
}

interface CompleteSessionRow {
  completedAt?: string | Date | null;
}

export const completeSessionV2 = async (token: string): Promise<CompleteSessionResponseV2> => {
  const response = await axiosInstance.post<DataEnvelope<CompleteSessionRow>>(
    '/carrier-portal/session/complete',
    {},
    portalHeaders(token),
  );
  const row = response.data.data;
  const raw = row?.completedAt ?? null;
  if (raw === null) {
    return { completedAt: null };
  }
  if (raw instanceof Date) {
    return { completedAt: raw.toISOString() };
  }
  return { completedAt: raw };
};

export const saveLanePreferencesV2 = async (
  token: string,
  payload: Record<string, unknown>,
): Promise<unknown> => {
  const response = await axiosInstance.post<DataEnvelope<unknown>>(
    '/carrier-portal/lane-preferences',
    payload,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Documents (3-step upload: presign → PUT → confirm)
// ---------------------------------------------------------------------------

export interface PresignBodyV2 {
  fileName: string;
  mimeType: string;
  type: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
}

export const presignDocumentV2 = async (
  token: string,
  body: PresignBodyV2,
): Promise<PresignResponseV2> => {
  const response = await axiosInstance.post<DataEnvelope<PresignResponseV2>>(
    '/carrier-portal/documents/presign',
    body,
    portalHeaders(token),
  );
  return response.data.data;
};

export const confirmDocumentV2 = async (
  token: string,
  id: string,
  body: { key: string },
): Promise<PortalDocumentV2> => {
  const response = await axiosInstance.post<DataEnvelope<PortalDocumentV2>>(
    `/carrier-portal/documents/${id}/confirm`,
    body,
    portalHeaders(token),
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Places — portal-authenticated address typeahead (BUG-06)
// ---------------------------------------------------------------------------

export const searchAddressesPortal = async (
  token: string,
  query: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<AddressSearchResult[]> => {
  const response = await axiosInstance.get<DataEnvelope<AddressSearchResult[]>>(
    '/carrier-portal/places/address-search',
    {
      ...portalHeaders(token),
      params: { query, limit },
      signal,
    },
  );
  return response.data.data;
};

export const uploadToPresignedUrl = async (uploadUrl: string, file: File): Promise<void> => {
  await axiosInstance.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    // Presigned S3 PUTs are unauthenticated and reject extra headers.
    withCredentials: false,
    transformRequest: [(data: unknown): unknown => data],
  });
};
