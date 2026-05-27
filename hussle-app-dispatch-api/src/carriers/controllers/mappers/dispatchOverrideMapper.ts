import type { Request } from 'express';

export interface DispatchOverrideInput {
  carrierId: string;
  loadId: string;
  reason: string;
  organizationId: string;
  userId: string;
}

export const dispatchOverrideMapper = (req: Request): DispatchOverrideInput => ({
  carrierId: req.params['id'] ?? '',
  loadId: req.body?.loadId as string,
  reason: req.body?.reason as string,
  organizationId: req.organizationId ?? '',
  userId: req.user?.userId ?? '',
});
