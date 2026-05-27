import type { Request } from 'express';

import type { RequestAgreementInput } from '../../services/requestAgreement';

/**
 * Map POST /api/v1/agreements request to RequestAgreementInput.
 *
 * `orgName` is resolved by the controller via the organization queries port and
 * passed in here, so the mapper stays a pure request-to-input shape adapter.
 */
export const requestAgreementMapper = (req: Request, orgName: string): RequestAgreementInput => {
  const body = req.body as {
    carrierId: string;
    templateKey: 'DISPATCH_AGREEMENT';
    signerName?: string;
    signerEmail?: string;
    correlationId?: string;
  };

  return {
    carrierId: body.carrierId,
    templateKey: body.templateKey,
    signerName: body.signerName,
    signerEmail: body.signerEmail,
    correlationId: body.correlationId,
    organizationId: req.organizationId ?? '',
    requestingUserId: req.user?.userId ?? '',
    orgName,
  };
};
