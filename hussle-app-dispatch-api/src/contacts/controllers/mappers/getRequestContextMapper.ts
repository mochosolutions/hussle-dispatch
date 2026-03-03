import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';

export interface RequestContext {
  organizationId: string;
}

export const getRequestContextMapper = (req: Request): RequestContext => {
  const organizationId = req.organizationId;

  if (organizationId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return { organizationId };
};
