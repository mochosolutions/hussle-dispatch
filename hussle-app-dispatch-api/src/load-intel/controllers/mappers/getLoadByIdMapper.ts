import type { Request } from 'express';

export const getLoadByIdMapper = (req: Request): { orgId: string; loadHash: string } => ({
  orgId: req.organizationId ?? '',
  loadHash: req.params['id'] ?? '',
});
