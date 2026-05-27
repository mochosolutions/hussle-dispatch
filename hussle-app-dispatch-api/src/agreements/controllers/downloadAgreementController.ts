import type { Request, RequestHandler, Response } from 'express';

import { NotFoundError } from '@/shared/errors';
import { streamFileResponse } from '@/shared/storage/streamFileResponse';
import type { StorageProvider } from '@/shared/storage';
import type { Logger } from '@/shared/utils/logger';

import type { AgreementRepoPort } from '../types/agreementRepoPort';

export interface DownloadAgreementControllerDeps {
  agreementRepo: AgreementRepoPort;
  storage: StorageProvider;
  logger: Logger;
}

/**
 * GET /api/v1/agreements/:id/download?artifact=signed|audit
 *
 * Auth + org-scope checked: 404 (not 403) on cross-org or missing so the
 * endpoint never leaks the existence of agreements that aren't ours.
 *
 * Resolves the storage key off the agreement row and 302-redirects to a
 * short-lived presigned URL via streamFileResponse.
 */
export const downloadAgreementController = (
  deps: DownloadAgreementControllerDeps,
): RequestHandler => async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const organizationId = req.organizationId ?? '';

  const agreement = await deps.agreementRepo.findById(id);

  // findById is unscoped — enforce org scope here.
  if (agreement === null || agreement.organizationId !== organizationId) {
    throw new NotFoundError('Agreement not found');
  }

  const artifact = req.query['artifact'] === 'audit' ? 'audit' : 'signed';
  const storageKey =
    artifact === 'audit' ? agreement.auditCertificateS3Key : agreement.signedPdfS3Key;

  if (storageKey === null || storageKey === undefined || storageKey === '') {
    throw new NotFoundError(
      `Agreement ${artifact === 'audit' ? 'audit certificate' : 'signed PDF'} is not available`,
    );
  }

  const filenameStem =
    artifact === 'audit'
      ? `Audit_Certificate_${agreement.id}.pdf`
      : `Signed_Agreement_${agreement.id}.pdf`;

  deps.logger.info('Agreement artifact download', {
    agreementId: agreement.id,
    organizationId,
    artifact,
  });

  await streamFileResponse({
    res,
    storageProvider: deps.storage,
    key: storageKey,
    displayName: filenameStem,
    disposition: 'inline',
  });
};
