import type { Request, RequestHandler, Response } from 'express';

import { ForbiddenError, NotFoundError } from '@/shared/errors';
import type { SignatureService } from '@/shared/signatures/types';
import type { StorageProvider } from '@/shared/storage';
import type { Logger } from '@/shared/utils/logger';

import type { AgreementRepoPort } from '../types/agreementRepoPort';
import { agreementTransformer } from './transformers/agreementTransformer';

export interface GetAgreementControllerDeps {
  agreementRepo: AgreementRepoPort;
  signatureService: SignatureService;
  storage: StorageProvider;
  logger: Logger;
  now?: () => Date;
}

/**
 * GET /api/v1/agreements/:id
 *
 * Org-scoped read. If the cached embedUrl on a PENDING agreement has expired,
 * transparently refresh it via the signature provider and persist the new URL
 * before transforming the response.
 */
export const getAgreementController = (
  deps: GetAgreementControllerDeps,
): RequestHandler => async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] ?? '';
  const organizationId = req.organizationId ?? '';
  const now = (deps.now ?? (() => new Date()))();

  let agreement = await deps.agreementRepo.findById(id);
  if (agreement === null) {
    throw new NotFoundError(`Agreement not found: ${id}`);
  }
  if (agreement.organizationId !== organizationId) {
    throw new ForbiddenError('Agreement does not belong to this organization');
  }

  const isPending = agreement.status === 'PENDING';
  const embedExpired =
    agreement.embedUrlExpiresAt !== null && agreement.embedUrlExpiresAt < now;
  const hasProviderId =
    agreement.providerSubmissionId !== null && agreement.providerSubmissionId.length > 0;

  if (isPending && embedExpired && hasProviderId && agreement.providerSubmissionId !== null) {
    deps.logger.info('Refreshing expired agreement embed URL', {
      agreementId: agreement.id,
      providerSubmissionId: agreement.providerSubmissionId,
    });
    const refreshed = await deps.signatureService.refreshEmbedUrl(agreement.providerSubmissionId);
    agreement = await deps.agreementRepo.update(agreement.id, {
      embedUrl: refreshed.embedUrl,
      embedUrlExpiresAt: refreshed.expiresAt,
    });
  }

  const data = await agreementTransformer(agreement, { storage: deps.storage });
  res.status(200).json({ data });
};
