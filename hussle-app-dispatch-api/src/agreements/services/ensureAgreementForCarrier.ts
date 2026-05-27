import { AgreementTemplateKey } from '@prisma/client';

import type { Logger } from '@/shared/utils/logger';

import type { OrganizationQueryPort } from '../queries/organizationQueries';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';
import type { RequestAgreementInput } from './requestAgreement';

export interface EnsureAgreementForCarrierInput {
  carrierId: string;
  organizationId: string;
  templateKey: AgreementTemplateKey;
  // Optional — when null/undefined the agreement is recorded with
  // `createdByUserId = null` (carrier-initiated lazy creation from the portal).
  requestingUserId?: string | null;
  // Optional overrides for the DocuSeal recipient. Carriers managed via the
  // dispatcher UI usually have a `primaryContact` row; carriers that completed
  // their portal flow without one need these passed from the onboarding
  // session's company answers so DocuSeal has someone to send the envelope to.
  signerName?: string;
  signerEmail?: string;
}

export interface EnsureAgreementForCarrierDeps {
  agreementRepo: AgreementRepoPort;
  orgQueries: OrganizationQueryPort;
  requestAgreement: (
    input: RequestAgreementInput,
  ) => Promise<AgreementServiceResult<Agreement>>;
  logger: Logger;
}

const NON_TERMINAL_STATUSES = new Set(['PENDING', 'SIGNED']);

/**
 * Idempotent "get-or-create" for a carrier's agreement.
 *
 * Used as the carrier-portal safety net: when the carrier reaches the Sign
 * Agreement step and no agreement exists yet, the portal calls this to lazily
 * create one. Dispatcher-initiated creation goes through `requestAgreement`
 * directly (so it can pass overrides like `signerName`/`signerEmail`).
 *
 * Behavior:
 *   - If a PENDING or SIGNED agreement exists, return it.
 *   - If a VOIDED/DECLINED/EXPIRED/DRAFT agreement exists, fall through and
 *     create a new one (the prior is no longer signable).
 *   - Bubbles up errors from `requestAgreement` (DocuSeal outage, etc.) so
 *     the caller can decide whether to surface or retry.
 *
 * Returns `{ data, events }` so the caller can dispatch the `agreement.generated`
 * event identically to the dispatcher path.
 */
export const ensureAgreementForCarrier = async (
  input: EnsureAgreementForCarrierInput,
  deps: EnsureAgreementForCarrierDeps,
): Promise<AgreementServiceResult<Agreement>> => {
  const existing = await deps.agreementRepo.findLatestForCarrier(
    input.carrierId,
    input.templateKey,
  );

  if (existing && NON_TERMINAL_STATUSES.has(existing.status)) {
    return { data: existing, events: [] };
  }

  const orgName = await deps.orgQueries.findOrgNameById(input.organizationId);

  deps.logger.info('Lazily creating agreement for carrier', {
    carrierId: input.carrierId,
    organizationId: input.organizationId,
    templateKey: input.templateKey,
    triggeredBy: input.requestingUserId ?? 'portal-safety-net',
  });

  return deps.requestAgreement({
    carrierId: input.carrierId,
    templateKey: 'DISPATCH_AGREEMENT',
    organizationId: input.organizationId,
    orgName,
    requestingUserId: input.requestingUserId ?? null,
    signerName: input.signerName,
    signerEmail: input.signerEmail,
  });
};
