import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';

export interface LoadSubResourceContext {
  loadId: string;
  organizationId: string;
}

export const loadSubResourceMapper = (req: Request): LoadSubResourceContext => {
  const organizationId = req.organizationId;
  const loadId = req.params['id'];

  if (organizationId === undefined || loadId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return { loadId, organizationId };
};
