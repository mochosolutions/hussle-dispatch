import type { Request } from 'express';

export interface ApproveCarrierInput {
  carrierId: string;
  organizationId: string;
  userId: string;
}

export interface RejectCarrierInput {
  carrierId: string;
  organizationId: string;
  userId: string;
  reason: string;
}

export const approveCarrierMapper = (req: Request): ApproveCarrierInput => ({
  carrierId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
  userId: req.user?.userId ?? '',
});

export const rejectCarrierMapper = (req: Request): RejectCarrierInput => ({
  carrierId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
  userId: req.user?.userId ?? '',
  reason: req.body?.reason as string,
});

export interface AdminActivateCarrierInput {
  carrierId: string;
  organizationId: string;
  userId: string;
  reason: string;
  evidenceDocumentId?: string;
}

export const adminActivateCarrierMapper = (req: Request): AdminActivateCarrierInput => {
  const evidenceDocumentId = req.body?.evidenceDocumentId as string | undefined;
  return {
    carrierId: req.params['id'] ?? '',
    organizationId: req.organizationId ?? '',
    userId: req.user?.userId ?? '',
    reason: req.body?.reason as string,
    ...(evidenceDocumentId !== undefined && { evidenceDocumentId }),
  };
};

export interface SuspendCarrierInput {
  carrierId: string;
  organizationId: string;
  userId: string;
  reason: string;
}

export interface UnsuspendCarrierInput {
  carrierId: string;
  organizationId: string;
  userId: string;
}

export const suspendCarrierMapper = (req: Request): SuspendCarrierInput => ({
  carrierId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
  userId: req.user?.userId ?? '',
  reason: req.body?.reason as string,
});

export const unsuspendCarrierMapper = (req: Request): UnsuspendCarrierInput => ({
  carrierId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
  userId: req.user?.userId ?? '',
});
