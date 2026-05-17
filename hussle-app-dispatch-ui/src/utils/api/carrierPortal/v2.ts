// ---------------------------------------------------------------------------
// Carrier Portal V2 — API client (Bearer/invite-token auth)
//
// All endpoints accept the invite token as the first argument and translate it
// into an `Authorization: Bearer <token>` header. Payloads/responses follow the
// `{ data: ... }` envelope convention used across the portal API surface.
// ---------------------------------------------------------------------------

import type { AxiosRequestConfig } from 'axios';

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
  const response = await axiosInstance.get<DataEnvelope<AgreementSnapshotV2 | null>>(
    '/carrier-portal/agreements',
    {
      ...portalHeaders(token),
      params: { templateKey },
    },
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Cost Analysis / Lane Preferences
// ---------------------------------------------------------------------------

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
  filename: string;
  contentType: string;
  documentType: string;
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

export const uploadToPresignedUrl = async (uploadUrl: string, file: File): Promise<void> => {
  await axiosInstance.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    // Presigned S3 PUTs are unauthenticated and reject extra headers.
    withCredentials: false,
    transformRequest: [(data: unknown): unknown => data],
  });
};
