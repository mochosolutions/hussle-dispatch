import type { Request } from 'express';

import type { VoidAgreementInput } from '../../services/voidAgreement';

/**
 * Map POST /api/v1/agreements/:id/void request to VoidAgreementInput.
 */
export const voidAgreementMapper = (req: Request): VoidAgreementInput => {
  const id = req.params['id'] ?? '';
  const body = (req.body as { reason?: string } | undefined) ?? {};
  return {
    agreementId: id,
    organizationId: req.organizationId ?? '',
    requestingUserId: req.user?.userId ?? '',
    reason: body.reason,
  };
};
