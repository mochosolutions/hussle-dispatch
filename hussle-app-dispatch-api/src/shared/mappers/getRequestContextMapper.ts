import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';

export interface RequestContext {
  organizationId: string;
  role: string;
}

export const getRequestContextMapper = (req: Request): RequestContext => {
  const organizationId = req.organizationId;
  const role = req.user?.role;

  if (organizationId === undefined || role === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return { organizationId, role };
};
