import type { Request } from 'express';
import type { AgreementTemplateKey } from '@prisma/client';

import type { CreateManualAgreementInput } from '../../services/createManualAgreement';

/**
 * Map POST /api/v1/agreements/manual request body + auth context to the
 * service input shape.
 */
export const createManualAgreementMapper = (req: Request): CreateManualAgreementInput => {
  const body = req.body as {
    carrierId: string;
    templateKey: AgreementTemplateKey;
    signedPdfS3Key: string;
    signerName: string;
    signerEmail?: string;
    signedAt: string | Date;
  };

  return {
    organizationId: req.organizationId ?? '',
    carrierId: body.carrierId,
    templateKey: body.templateKey,
    signedPdfS3Key: body.signedPdfS3Key.trim(),
    signerName: body.signerName.trim(),
    signerEmail:
      typeof body.signerEmail === 'string' && body.signerEmail.trim().length > 0
        ? body.signerEmail.trim()
        : null,
    signedAt: body.signedAt instanceof Date ? body.signedAt : new Date(body.signedAt),
    createdByUserId: req.user?.userId ?? '',
  };
};
