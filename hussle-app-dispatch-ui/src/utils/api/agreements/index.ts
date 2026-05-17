// ---------------------------------------------------------------------------
// Agreements — dispatcher-side API helper (session/cookie auth).
//
// This file wraps `POST /api/v1/agreements`, which requires dispatcher
// organization context (`req.organizationId`) per
// `agreements/controllers/requestAgreementController.ts`. The carrier portal
// (invite-token auth) cannot call it directly — a follow-on task should add a
// portal-scoped equivalent under `/carrier-portal/agreements`.
//
// The helper is exported here so future dispatcher-side flows
// ("send agreement to carrier" action) have a single client to consume.
// ---------------------------------------------------------------------------

import axiosInstance from 'utils/axios';

import type { AgreementContext } from 'features/carrier-portal-v2/engine';

interface CreateAgreementInput {
  carrierId: string;
  templateKey: string;
}

interface DataEnvelope<T> {
  data: T;
}

export const createAgreement = async (
  input: CreateAgreementInput,
): Promise<AgreementContext> => {
  const response = await axiosInstance.post<DataEnvelope<AgreementContext>>(
    '/api/v1/agreements',
    input,
  );
  return response.data.data;
};
