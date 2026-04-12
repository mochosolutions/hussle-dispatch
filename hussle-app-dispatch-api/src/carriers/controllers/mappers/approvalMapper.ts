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
