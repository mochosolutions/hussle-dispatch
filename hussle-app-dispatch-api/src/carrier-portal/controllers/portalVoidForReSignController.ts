import type { Request, Response } from 'express';

import { UnauthorizedError, ValidationError } from '@/shared/errors/commonErrors';

export type IdentityField = 'legalName' | 'mcNumber' | 'dotNumber';

export interface PortalVoidForReSignControllerDeps {
  voidForReSign: (input: {
    carrierId: string;
    organizationId: string;
    changedFields: IdentityField[];
  }) => Promise<{ voidedAgreementIds: string[] }>;
}

const ALLOWED_FIELDS: readonly IdentityField[] = ['legalName', 'mcNumber', 'dotNumber'] as const;

const getPortalContext = (req: Request): { carrierId: string; organizationId: string } => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return {
    carrierId: req.carrierPortal.carrierId,
    organizationId: req.carrierPortal.organizationId,
  };
};

const parseChangedFields = (raw: unknown): IdentityField[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ValidationError('changedFields must be a non-empty array');
  }
  const out: IdentityField[] = [];
  for (const value of raw) {
    if (typeof value !== 'string' || !ALLOWED_FIELDS.includes(value as IdentityField)) {
      throw new ValidationError(
        `changedFields entries must be one of: ${ALLOWED_FIELDS.join(', ')}`,
      );
    }
    if (!out.includes(value as IdentityField)) {
      out.push(value as IdentityField);
    }
  }
  return out;
};

/**
 * POST /api/v1/carrier-portal/agreements/void-for-resign
 *
 * Body: { changedFields: ('legalName' | 'mcNumber' | 'dotNumber')[] }
 *
 * Voids every signed agreement for the authenticated carrier and clears the
 * agreement-signed projection on Carrier so the subsequent saveCompany call
 * can proceed. Emits one `agreement.voided` event per affected agreement
 * with voidReason = 'CARRIER_IDENTITY_CHANGED'.
 */
export const createPortalVoidForReSignController =
  (deps: PortalVoidForReSignControllerDeps) =>
  async (req: Request, res: Response): Promise<void> => {
    const { carrierId, organizationId } = getPortalContext(req);
    const body = (req.body ?? {}) as { changedFields?: unknown };
    const changedFields = parseChangedFields(body.changedFields);

    const result = await deps.voidForReSign({ carrierId, organizationId, changedFields });
    res.status(200).json({ data: result });
  };
