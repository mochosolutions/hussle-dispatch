import type { Request } from 'express';
import { UnauthorizedError, ValidationError } from '@/shared/errors';

export interface DocumentIdInput {
  id: string;
  organizationId: string;
}

export const documentIdMapper = (req: Request): DocumentIdInput => {
  const organizationId = req.organizationId;
  if (organizationId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const id = req.params['id'];
  if (id === undefined || id.length === 0) {
    throw new ValidationError('Missing required id parameter');
  }

  return { id, organizationId };
};
