// ---------------------------------------------------------------------------
// Agreements — dispatcher-side API client (session/cookie auth).
//
// Wraps the `/api/v1/agreements` admin routes. Cross-org scope checks happen
// on the server; callers pass only request shapes and receive transformed
// Agreement DTOs. Carrier-portal (invite-token) flows live in
// `features/carrier-portal/` and have their own client.
// ---------------------------------------------------------------------------

import axiosInstance from 'utils/axios';

import type {
  Agreement,
  CreateManualAgreementInput,
  RequestAgreementInput,
  VoidAgreementInput,
} from 'features/agreements/types';

interface AgreementListResponse {
  data: Agreement[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface AgreementSingleResponse {
  data: Agreement;
}

export const listAgreementsByCarrier = async (carrierId: string): Promise<Agreement[]> => {
  const response = await axiosInstance.get<AgreementListResponse>('/agreements', {
    params: { carrierId },
  });
  return response.data.data;
};

export const requestAgreement = async (
  input: RequestAgreementInput,
): Promise<Agreement> => {
  const response = await axiosInstance.post<AgreementSingleResponse>(
    '/agreements',
    input,
  );
  return response.data.data;
};

export const createManualAgreement = async (
  input: CreateManualAgreementInput,
): Promise<Agreement> => {
  const response = await axiosInstance.post<AgreementSingleResponse>(
    '/agreements/manual',
    input,
  );
  return response.data.data;
};

export const voidAgreement = async (input: VoidAgreementInput): Promise<Agreement> => {
  const response = await axiosInstance.post<AgreementSingleResponse>(
    `/agreements/${input.id}/void`,
    { reason: input.reason },
  );
  return response.data.data;
};

/**
 * Absolute URL for the scoped download endpoint. The endpoint 302-redirects
 * to a short-lived presigned URL — safe to put in a target=_blank link.
 */
export const downloadAgreementUrl = (
  id: string,
  artifact: 'signed' | 'audit' = 'signed',
): string =>
  `${axiosInstance.defaults.baseURL ?? ''}/agreements/${id}/download?artifact=${artifact}`;
