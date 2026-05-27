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

const parseTemplateKeys = (raw: unknown): AgreementTemplateKey[] => {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new BadRequestError('templateKeys is required');
  }
  const tokens = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    throw new BadRequestError('templateKeys must contain at least one key');
  }
  for (const t of tokens) {
    if (t !== 'DISPATCH_AGREEMENT') {
      throw new BadRequestError(`Unknown templateKey: ${t}`);
    }
  }
  return tokens as AgreementTemplateKey[];
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
 * GET /api/v1/carrier-portal/agreements?templateKeys=KEY1,KEY2
 *
 * Returns `{ data: Record<templateKey, AgreementContext> }` for the carrier
 * derived from the invite-token context. Each requested key is lazily
 * ensured via `ensureForCarrier` so the carrier never sees a dead-end when
 * the dispatcher hasn't pre-generated the envelope.
 *
 * Pagination metadata is omitted — the response is a keyed object, not a
 * list. Adding new template keys (W-9, Broker-Carrier Master) is purely a
 * matter of extending the Prisma enum + the registry; no controller changes.
 */
export const createPortalAgreementControllers = (deps: PortalAgreementControllerDeps) => ({
  getLatestForCarrier: async (req: Request, res: Response): Promise<void> => {
    const carrierId = getCarrierId(req);
    const organizationId = req.carrierPortal?.organizationId ?? '';
    const templateKeys = parseTemplateKeys(req.query['templateKeys']);

    const signer = await resolveSignerFromSession(deps.sessionRepo, carrierId);

    const entries = await Promise.all(
      templateKeys.map(async (templateKey) => {
        const ensured = await deps.agreementQueries.ensureForCarrier({
          carrierId,
          organizationId,
          templateKey,
          ...signer,
        });
        const response = await agreementTransformer(ensured.data, { storage: deps.storage });
        return [templateKey, response] as const;
      }),
    );

    const data: Record<string, Awaited<ReturnType<typeof agreementTransformer>>> = {};
    for (const [key, value] of entries) {
      data[key] = value;
    }

    res.status(200).json({ data });
  },
});
