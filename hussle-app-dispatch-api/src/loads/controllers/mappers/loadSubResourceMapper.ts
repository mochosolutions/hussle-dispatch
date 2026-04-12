import type { Request } from 'express';

export interface LoadSubResourceContext {
  loadId: string;
  organizationId: string;
}

export const loadSubResourceMapper = (req: Request): LoadSubResourceContext => ({
  loadId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
});
