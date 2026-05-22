import type { Request, Response } from 'express';
import { AgreementTemplateKey } from '@prisma/client';

import { UnauthorizedError } from '@/shared/errors/commonErrors';
import { BadRequestError } from '@mocho/common';
import type { StorageProvider } from '@/shared/storage';

import { agreementTransformer } from '@/agreements/controllers/transformers/agreementTransformer';
import type { OnboardingSessionRepoPort } from '../types/onboardingSessionRepoPort';
import type { PortalAgreementQueryPort } from '../types/portalAgreementQueryPort';

export interface PortalAgreementControllerDeps {
  agreementQueries: PortalAgreementQueryPort;
  sessionRepo: OnboardingSessionRepoPort;
  storage: StorageProvider;
}

const getCarrierId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.carrierId;
};

const parseTemplateKey = (raw: unknown): AgreementTemplateKey => {
  if (raw === 'DISPATCH_AGREEMENT') {
    return AgreementTemplateKey.DISPATCH_AGREEMENT;
  }
  throw new BadRequestError('templateKey must be DISPATCH_AGREEMENT');
};

const pickString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

/**
 * Pull signer overrides out of the onboarding session's company answers so the
 * safety-net agreement creation has a recipient to send the DocuSeal envelope
 * to. Reads both the legacy nested shape (`answers.company.*`) and the v2 flat
 * dot-key shape (`answers['company.*']`).
 */
const resolveSignerFromSession = async (
  sessionRepo: OnboardingSessionRepoPort,
  carrierId: string,
): Promise<{ signerName?: string; signerEmail?: string }> => {
  const session = await sessionRepo.findByCarrierId(carrierId);
  const answers = session?.answers as Record<string, unknown> | null | undefined;
  if (!answers || typeof answers !== 'object') {
    return {};
  }

  const nestedCompany =
    typeof answers['company'] === 'object' && answers['company'] !== null
      ? (answers['company'] as Record<string, unknown>)
      : undefined;

  const signerEmail =
    pickString(answers['company.email']) ?? pickString(nestedCompany?.['email']);
  const signerName =
    pickString(answers['company.signatoryName']) ??
    pickString(nestedCompany?.['signatoryName']) ??
    pickString(answers['company.legalName']) ??
    pickString(nestedCompany?.['legalName']) ??
    pickString(answers['company.name']) ??
    pickString(nestedCompany?.['name']);

  return { signerName, signerEmail };
};

/**
 * GET /api/v1/carrier-portal/agreements
 *
 * Returns the most-recent agreement matching the carrier (from invite-token
 * context) + templateKey query, wrapped as a single-item list to match the
 * dispatcher endpoint shape: { data: [...], pagination: { ... } }.
 *
 * Safety net: if the dispatcher never pre-generated the agreement, this lazily
 * creates one via `ensureForCarrier` so the carrier never sees a dead-end
 * "Contact dispatcher" message on the Sign Agreement step. The dispatcher's
 * "send agreement" UX (to be added) is the primary trigger; this is the
 * fallback for missed events / unsent envelopes.
 */
export const createPortalAgreementControllers = (deps: PortalAgreementControllerDeps) => ({
  getLatestForCarrier: async (req: Request, res: Response): Promise<void> => {
    const carrierId = getCarrierId(req);
    const organizationId = req.carrierPortal?.organizationId ?? '';
    const templateKey = parseTemplateKey(req.query['templateKey']);

    const signer = await resolveSignerFromSession(deps.sessionRepo, carrierId);

    const ensured = await deps.agreementQueries.ensureForCarrier({
      carrierId,
      organizationId,
      templateKey,
      ...signer,
    });

    const items = [await agreementTransformer(ensured.data, { storage: deps.storage })];

    res.status(200).json({
      data: items,
      pagination: {
        page: 1,
        limit: 1,
        total: items.length,
        totalPages: 1,
        hasMore: false,
      },
    });
  },
});
